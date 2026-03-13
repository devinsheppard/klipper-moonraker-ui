#!/usr/bin/env python3
"""Moonraker + Forge UI print recorder and timelapse generator.

This service polls Moonraker print state. When a print starts, it records the
configured camera stream to a full-length video. When the print ends, it
renders a timelapse from the recorded file.
"""

from __future__ import annotations

import argparse
import json
import os
import signal
import subprocess
import sys
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Optional
from urllib import error, parse, request

TERMINAL_PRINT_STATES = {"complete", "cancelled", "error", "standby"}
ACTIVE_PRINT_STATES = {"printing", "paused"}


@dataclass
class RecorderConfig:
    moonraker_url: str
    camera_url: str
    output_dir: Path
    poll_seconds: float = 2.0
    timelapse_target_seconds: float = 45.0
    timelapse_fps: int = 30
    keep_raw_video: bool = True
    ffmpeg_path: str = "ffmpeg"
    ffprobe_path: str = "ffprobe"
    video_codec: str = "libx264"
    video_crf: int = 23
    video_preset: str = "veryfast"


@dataclass
class RecordingSession:
    print_name: str
    session_slug: str
    raw_video_path: Path
    timelapse_path: Path
    ffmpeg_process: subprocess.Popen


class MoonrakerTimelapseRecorder:
    def __init__(self, config: RecorderConfig) -> None:
        self.config = config
        self._active_session: Optional[RecordingSession] = None
        self._last_filename = ""
        self._running = True

        self.raw_dir = config.output_dir / "raw"
        self.timelapse_dir = config.output_dir / "timelapse"
        self.raw_dir.mkdir(parents=True, exist_ok=True)
        self.timelapse_dir.mkdir(parents=True, exist_ok=True)

        signal.signal(signal.SIGINT, self._handle_signal)
        signal.signal(signal.SIGTERM, self._handle_signal)

    def run(self) -> int:
        self._log("Recorder started.")
        self._log(f"Moonraker: {self.config.moonraker_url}")
        self._log(f"Camera: {self.config.camera_url}")
        self._log(f"Output: {self.config.output_dir}")

        while self._running:
            try:
                print_stats = self._query_print_stats()
                self._process_print_stats(print_stats)
            except Exception as exc:  # noqa: BLE001
                self._log(f"Loop error: {exc}")

            time.sleep(max(0.2, self.config.poll_seconds))

        if self._active_session:
            self._log("Shutting down with active recording; finalizing.")
            self._stop_recording_and_render(reason="shutdown")

        self._log("Recorder stopped.")
        return 0

    def _handle_signal(self, signum: int, _frame: Any) -> None:
        self._log(f"Signal {signum} received. Stopping...")
        self._running = False

    def _query_print_stats(self) -> dict[str, Any]:
        base = self.config.moonraker_url.rstrip("/")
        endpoint = f"{base}/printer/objects/query?{parse.urlencode({'print_stats': ''})}"
        req = request.Request(endpoint, headers={"User-Agent": "forge-timelapse-recorder"})

        try:
            with request.urlopen(req, timeout=8) as resp:
                payload = json.loads(resp.read().decode("utf-8", errors="replace"))
        except error.URLError as exc:
            raise RuntimeError(f"Moonraker query failed: {exc}") from exc

        status = payload.get("result", {}).get("status", {})
        print_stats = status.get("print_stats")
        if not isinstance(print_stats, dict):
            raise RuntimeError("Moonraker response missing print_stats")
        return print_stats

    def _process_print_stats(self, print_stats: dict[str, Any]) -> None:
        state = str(print_stats.get("state", "")).strip().lower()
        filename = str(print_stats.get("filename", "")).strip()

        if state in ACTIVE_PRINT_STATES:
            if not self._active_session:
                self._start_recording(filename=filename)
                self._last_filename = filename
                return

            if filename and self._last_filename and filename != self._last_filename:
                self._log(
                    "Detected print filename change while recording. "
                    f"Old='{self._last_filename}' New='{filename}'. Rotating session."
                )
                self._stop_recording_and_render(reason="filename changed")
                self._start_recording(filename=filename)

            self._last_filename = filename
            return

        if self._active_session and state in TERMINAL_PRINT_STATES:
            self._stop_recording_and_render(reason=f"print state={state}")
            self._last_filename = ""

    def _start_recording(self, filename: str) -> None:
        print_name = filename or "unknown_print"
        session_slug = self._build_session_slug(print_name)
        raw_video_path = self.raw_dir / f"{session_slug}.mp4"
        timelapse_path = self.timelapse_dir / f"{session_slug}_timelapse.mp4"

        ffmpeg_cmd = [
            self.config.ffmpeg_path,
            "-hide_banner",
            "-loglevel",
            "warning",
            "-y",
            "-fflags",
            "+genpts",
            "-use_wallclock_as_timestamps",
            "1",
            "-i",
            self.config.camera_url,
            "-an",
            "-c:v",
            self.config.video_codec,
            "-preset",
            self.config.video_preset,
            "-crf",
            str(self.config.video_crf),
            str(raw_video_path),
        ]

        self._log(f"Starting recording for '{print_name}'")
        self._log(f"Raw video: {raw_video_path}")

        try:
            proc = subprocess.Popen(  # noqa: S603
                ffmpeg_cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
                text=True,
            )
        except OSError as exc:
            raise RuntimeError(
                f"Failed to start ffmpeg. Is '{self.config.ffmpeg_path}' installed and in PATH?"
            ) from exc

        self._active_session = RecordingSession(
            print_name=print_name,
            session_slug=session_slug,
            raw_video_path=raw_video_path,
            timelapse_path=timelapse_path,
            ffmpeg_process=proc,
        )

    def _stop_recording_and_render(self, reason: str) -> None:
        session = self._active_session
        if not session:
            return

        self._log(f"Stopping recording ({reason}) for '{session.print_name}'")
        self._stop_ffmpeg_process(session.ffmpeg_process)

        if not session.raw_video_path.exists() or session.raw_video_path.stat().st_size <= 0:
            self._log(f"Raw video missing or empty: {session.raw_video_path}")
            self._active_session = None
            return

        try:
            duration = self._probe_duration_seconds(session.raw_video_path)
            self._render_timelapse(session.raw_video_path, session.timelapse_path, duration)
            self._log(f"Timelapse created: {session.timelapse_path}")

            if not self.config.keep_raw_video:
                session.raw_video_path.unlink(missing_ok=True)
                self._log(f"Deleted raw video: {session.raw_video_path}")

        except Exception as exc:  # noqa: BLE001
            self._log(f"Timelapse render failed: {exc}")

        self._active_session = None

    @staticmethod
    def _stop_ffmpeg_process(proc: subprocess.Popen) -> None:
        if proc.poll() is not None:
            return

        try:
            if proc.stdin:
                proc.stdin.write("q\n")
                proc.stdin.flush()
        except Exception:  # noqa: BLE001
            pass

        try:
            proc.wait(timeout=12)
            return
        except subprocess.TimeoutExpired:
            pass

        proc.terminate()
        try:
            proc.wait(timeout=6)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait(timeout=3)

    def _probe_duration_seconds(self, path: Path) -> float:
        cmd = [
            self.config.ffprobe_path,
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ]

        try:
            result = subprocess.run(  # noqa: S603
                cmd,
                capture_output=True,
                check=True,
                text=True,
            )
        except (OSError, subprocess.CalledProcessError) as exc:
            raise RuntimeError(
                f"Failed to probe duration with '{self.config.ffprobe_path}'."
            ) from exc

        raw = result.stdout.strip()
        duration = float(raw) if raw else 0.0
        if duration <= 0:
            raise RuntimeError("Could not determine recording duration")
        return duration

    def _render_timelapse(self, input_path: Path, output_path: Path, duration_seconds: float) -> None:
        target = max(5.0, float(self.config.timelapse_target_seconds))
        speed = max(1.0, duration_seconds / target)

        self._log(
            f"Rendering timelapse (duration={duration_seconds:.1f}s, target={target:.1f}s, speed={speed:.2f}x)"
        )

        vf = f"setpts=PTS/{speed:.6f},fps={int(self.config.timelapse_fps)}"

        cmd = [
            self.config.ffmpeg_path,
            "-hide_banner",
            "-loglevel",
            "warning",
            "-y",
            "-i",
            str(input_path),
            "-an",
            "-vf",
            vf,
            "-c:v",
            self.config.video_codec,
            "-preset",
            self.config.video_preset,
            "-crf",
            str(self.config.video_crf),
            str(output_path),
        ]

        try:
            subprocess.run(cmd, check=True)  # noqa: S603
        except (OSError, subprocess.CalledProcessError) as exc:
            raise RuntimeError("ffmpeg timelapse render failed") from exc

    @staticmethod
    def _build_session_slug(filename: str) -> str:
        base = os.path.basename(filename)
        stem, _dot, _ext = base.partition(".")
        stem = stem or "print"

        sanitized = "".join(ch if ch.isalnum() or ch in ("-", "_") else "_" for ch in stem)
        sanitized = sanitized.strip("_") or "print"

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"{sanitized}_{timestamp}"

    @staticmethod
    def _log(message: str) -> None:
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{now}] {message}", flush=True)


def load_config(path: Path) -> RecorderConfig:
    data = json.loads(path.read_text(encoding="utf-8"))

    moonraker_url = str(data.get("moonraker_url", "http://127.0.0.1:7125")).strip()
    camera_url = str(data.get("camera_url", "")).strip()
    output_dir = Path(str(data.get("output_dir", "./recordings"))).expanduser()

    if not camera_url:
        raise ValueError("Config must include 'camera_url'")

    return RecorderConfig(
        moonraker_url=moonraker_url,
        camera_url=camera_url,
        output_dir=output_dir,
        poll_seconds=float(data.get("poll_seconds", 2.0)),
        timelapse_target_seconds=float(data.get("timelapse_target_seconds", 45.0)),
        timelapse_fps=int(data.get("timelapse_fps", 30)),
        keep_raw_video=bool(data.get("keep_raw_video", True)),
        ffmpeg_path=str(data.get("ffmpeg_path", "ffmpeg")),
        ffprobe_path=str(data.get("ffprobe_path", "ffprobe")),
        video_codec=str(data.get("video_codec", "libx264")),
        video_crf=int(data.get("video_crf", 23)),
        video_preset=str(data.get("video_preset", "veryfast")),
    )


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Record full print videos from Moonraker camera and auto-generate timelapses."
    )
    parser.add_argument(
        "--config",
        default="tools/timelapse_recorder/config.example.json",
        help="Path to recorder config JSON.",
    )
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    config_path = Path(args.config).expanduser()

    if not config_path.exists():
        print(f"Config not found: {config_path}", file=sys.stderr)
        return 2

    try:
        config = load_config(config_path)
    except Exception as exc:  # noqa: BLE001
        print(f"Config error: {exc}", file=sys.stderr)
        return 2

    recorder = MoonrakerTimelapseRecorder(config)
    return recorder.run()


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

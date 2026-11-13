# BORA Sound Engine — 개발 베이스라인 v0.1

2026-11-13 · 사용자 제공 `soundlab_bf5c253.zip`의 Claude R-001 검토를 반영한 **별도 기술 시제품**.

이번에 실제 작성한 것:
- `src/mix_plan.mjs`: 음원 메타데이터 → 목적별 배합 계획을 반환하는 순수 JavaScript 함수 (DOM/오디오 장치/외부 API 호출 없음)
- `tests/test_all_175.mjs`와 `tests/test_matrix.mjs`: 10종의 175개 기본 조합 및 5가지 목적×4가지 출력기기(3,500개 경로)의 메타데이터 처리 규칙 검사
- `tests/render_check.py`: 기존 v0.4 MP3 일부 구간에서 두 대표 조합을 실제 WAV로 렌더하고 피크 검사
- `docs/G-1_R001_RESPONSE.md`: R-001의 기술 반론 중 동의·차이·추가 시험을 구분한 답변
- `docs/G-2_TEN_PRODUCTS_SPEC.md`: 10종 제품의 음향 사양과 외부 연구 간 차이
- `reports/`: 재현 가능한 자동 테스트 결과

**현재 한계:** 운영 중인 보라다방에 통합하지 않았고, 실제 175개 조합 전체 음향이나 인체 효능을 검증하지 않았습니다. 원본 MP3의 전체 마스터링도 다시 수행하지 않았습니다.

실행:
```
node tests/test_all_175.mjs
node tests/test_matrix.mjs
python tests/render_check.py --audio-dir /path/to/daily_signal_v04/audio
```

사용 라이브러리: Node.js 22, Python, `ffmpeg`, `numpy`, `scipy`, `soundfile`.

데모 WAV는 기존 v0.4 MP3를 일부 디코딩한 비교 시험 자료입니다. 약한 음량·실험적 자극이며 사용 기기의 실제 dB SPL 안전성을 보증하지 않습니다.

다음: Claude C-2 합성음 캡처 수령 → 실제 소리 측정 → manifest 표준 확정 → 브라우저 오디오 버스 통합·검증 → 사용자 승인 후 UI 반영.

`config/ci_workflow_EXAMPLE.yml`: 안전한 GitHub Actions 자동 검사 템플릿(제안만 작성, **실제 저장소에 적용하지 않음**). 수정/배포/AI API 호출 없이 Node.js 테스트만 실행합니다.

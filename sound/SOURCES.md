# sound/ 녹음 출처

2026-11-13 교체. 이전 Moodist 녹음 13개는 파일별 라이선스를 알 수 없어 모두 뺐다.
새 녹음은 오픈소스 앱 **Blanket**(github.com/rafaelmardojai/blanket, 커밋 bbc88ed)의 `data/resources/sounds/`에서 가져왔다. Blanket은 `SOUNDS_LICENSING.md`에 파일마다 원본·작성자·라이선스를 밝혀 두었다. (Blanket 코드는 GPL-3.0이지만 우리는 소리 파일만 쓰고, 소리는 아래 각자의 라이선스를 따른다.)

| 우리 파일 | Blanket 파일 | 원본 | 작성자 (Blanket 편집) | 라이선스 | 우리가 고친 것 |
|---|---|---|---|---|---|
| rain.mp3 | rain.ogg | https://freesound.org/people/alex36917/sounds/524605/ | alex36917 (Porrumentzio) | CC BY | MP3 96k로 |
| rain-window.mp3 | rain.ogg | 위와 같음 | 위와 같음 | CC BY | 2.2kHz 저역통과 두 번(창 닫힌 소리), MP3 96k |
| city.mp3 | city.ogg | https://freesound.org/people/gezortenplotz/sounds/44796/ | gezortenplotz (Porrumentzio) | CC BY | 모노, MP3 64k |
| waves.mp3 | waves.ogg | https://freesound.org/people/Luftrum/sounds/48412/ | Luftrum (Porrumentzio) | CC BY 4.0 (원본 페이지 확인) | 앞 90초, 끝 2초 페이드, MP3 96k |
| birds.mp3 | birds.ogg | https://freesound.org/people/kvgarlic/sounds/156826/ | kvgarlic (Porrumentzio) | CC0 | 앞 90초, 끝 2초 페이드, 모노, MP3 64k |
| wind.mp3 | wind.ogg | https://freesound.org/people/felix.blume/sounds/217506/ | felix.blume (Porrumentzio) | CC0 | 모노, MP3 64k |
| summer-night.mp3 | summer-night.ogg | https://soundbible.com/2083-Crickets-Chirping-At-Night.html | Lisa Redfern | 퍼블릭 도메인 | 모노, MP3 64k |

- **CC BY 버전**: 파도만 원본 페이지에서 4.0을 확인했다. 비·도시는 Freesound 페이지를 열 수 없어 Blanket 표기("CC BY")까지만 확인했다. 확인되면 이 표를 고친다.
- **표시 의무**: CC BY 소리는 사이트의 '소리 섞기 → 소리 출처'에 제목·작성자·원본 주소·라이선스·고친 것을 보여 준다.
- **변환 명령**: `soundlab/tools/`가 아니라 커밋 메시지에 남겼다. 원본은 Blanket에서 다시 받을 수 있다.
- **뺀 소리**: 사이렌, 끓는 물, 밤 마을, 개 짖는 소리, 라디오 잡음. 주전자는 합성음만 쓴다.
- **아직 출처 미확인**: `music/gm.json`(심포니·노래 짓기의 통기타 음 13개). 공개 음색 모음 MusyngKite의 steel 기타와 일부 비슷(상관 0.6 안팎)하지만 같은 파일은 아니다. 확인 전까지 결정 D-009로 남긴다.

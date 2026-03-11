# Strategic Technology Map

이 폴더는 GitHub Pages에 바로 올릴 수 있는 정적 웹사이트입니다.

## 들어있는 파일
- `index.html` : 웹사이트 본문
- `styles.css` : 푸른색 계열 다크 디자인
- `app.js` : 검색 / 필터 / 매트릭스 / 상세 보기 기능
- `data.json` : 기술 데이터
- `.nojekyll` : GitHub Pages용 설정 파일

## 반영한 기준
- PPT를 우선 기준으로 사용
- 엑셀은 세부 기술명, ●/○ 표기, 비고 보조 확인용으로 사용
- 방위산업기술보호법은 제거
- 조세특례제한법은 `조특법 국가전략`, `조특법 신성장원천`으로 분리
- 법령 5개는 모두 푸른색 계열로 구분

## GitHub를 처음 쓰는 사람용 업로드 방법
1. GitHub에 가입하고 로그인합니다.
2. 오른쪽 위 `+` 버튼을 누릅니다.
3. `New repository`를 누릅니다.
4. Repository name에 예를 들어 `strategic-technology-map` 을 입력합니다.
5. `Public` 을 선택합니다.
6. `Create repository` 를 누릅니다.
7. 저장소 화면에서 `Add file` → `Upload files` 를 누릅니다.
8. 이 ZIP을 먼저 압축 해제합니다.
9. 압축 해제한 폴더 안의 파일들을 전부 올립니다.
10. 아래 `Commit changes` 를 누릅니다.
11. 상단 `Settings` → 왼쪽 `Pages` 로 이동합니다.
12. Source 를 `Deploy from a branch` 로 선택합니다.
13. Branch 는 `main`, 폴더는 `/(root)` 로 두고 `Save` 를 누릅니다.
14. 1~3분 정도 기다리면 사이트 주소가 생성됩니다.

## 수정 방법
- 데이터 수정: `data.json`
- 디자인 수정: `styles.css`
- 기능 수정: `app.js`
- 문구 수정: `index.html`

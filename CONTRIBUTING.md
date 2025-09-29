# 기여 가이드

이 프로젝트에 기여해주셔서 감사합니다! 

## 개발 환경 설정

1. 레포지토리 클론
```bash
git clone https://github.com/USERNAME/annual-parallax-simulator.git
cd annual-parallax-simulator
```

2. 로컬 서버 실행 (선택사항)
```bash
# Python 3
python -m http.server 8000

# Node.js (http-server 설치 필요)
npx http-server

# Live Server (VS Code 확장) 사용
```

3. `http://localhost:8000`에서 테스트

## 기여 방법

### 버그 리포트
- Issues 탭에서 새 이슈 생성
- 버그 재현 단계와 예상 결과 설명
- 브라우저와 OS 정보 포함

### 기능 제안
- Issues 탭에서 Feature Request 템플릿 사용
- 교육적 가치와 구현 방법 설명

### 코드 기여
1. Fork 및 브랜치 생성
2. 변경사항 구현
3. 테스트 확인
4. Pull Request 생성

## 코드 스타일

- **HTML**: 2칸 들여쓰기, 시맨틱 태그 사용
- **CSS**: BEM 방법론 권장, 모바일 우선
- **JavaScript**: ES5 호환성 유지, 명확한 변수명 사용

## 라이선스

MIT 라이선스 하에 배포됩니다.
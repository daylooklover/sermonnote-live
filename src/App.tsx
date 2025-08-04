// src/App.tsx

import React from 'react';
// 다른 필요한 import 문을 여기에 추가하세요.
// 예: import { getAuth } from "firebase/auth"; // Firebase Auth를 사용하여 사용자 UID를 가져올 경우

// Paddle 객체 타입 선언 (window.Paddle을 사용하기 위함)
declare global {
  interface Window {
    Paddle: any; // Paddle 객체의 더 구체적인 타입 정의를 사용할 수도 있습니다.
  }
}

function App() {
  // Paddle Price ID를 여기에 정의합니다.
  // 이전에 Paddle 대시보드에서 얻은 실제 Price ID로 변경해야 합니다.
  // 이 ID들은 당신의 실제 라이브(production) 환경용 Price ID여야 합니다.
  const MONTHLY_PRICE_ID = "pri_01klehvp7rqm0i7q5i7h261mhmd"; // <-- 당신의 실제 월간 Price ID로 변경
  const ANNUAL_PRICE_ID = "pri_01klej3y6kd7i97z03kh3mms2";   // <-- 당신의 실제 연간 Price ID로 변경

  // 현재 로그인된 사용자의 Firebase UID를 가져오는 로직이 필요합니다.
  // 실제 앱에서는 Firebase Auth 등을 사용하여 로그인된 사용자 UID를 가져와야 합니다.
  // 예시: const auth = getAuth(); const currentUserId = auth.currentUser?.uid || "guest_user";
  const currentUserId = "FIREBASE_AUTH_UID_OF_CURRENT_USER"; // <-- 이 부분을 실제 사용자 UID로 변경해야 함. (테스트 시에는 더미 문자열도 가능)

  const openPaddleCheckout = (priceId: string) => {
    // Paddle SDK가 로드되었는지 확인
    if (window.Paddle) {
      window.Paddle.Checkout.open({
        items: [{
          priceId: priceId,
          quantity: 1,
        }],
        customer: {
          // Paddle 고객을 우리 서비스의 사용자 ID와 연결합니다.
          // 이 정보는 웹훅으로 다시 전달되어 Firestore에 저장될 때 사용됩니다.
          id: currentUserId, // 우리 서비스의 고유 사용자 ID (Firebase Auth UID)
          // email: "user@example.com", // 사용자 이메일을 전달할 수도 있습니다.
        },
        customData: {
          // 필요하다면 추가적인 사용자 정의 데이터를 전달합니다.
          // 이 데이터는 백엔드 웹훅에서 event.data.custom_data 로 접근할 수 있습니다.
          firebase_uid: currentUserId,
        },
        settings: {
          // Checkout 언어를 한국어로 설정할 수 있습니다.
          locale: 'ko',
          // Sandbox 모드가 아니므로, 테스트 카드 번호를 사용해야 합니다.
          // testing: true, // "production" 환경에서는 testing: true를 사용하지 마세요.
                          // 테스트는 Paddle의 테스트 카드 번호를 사용합니다.
        },
        // 결제 성공/실패 시 클라이언트 측에서 처리할 콜백 (백엔드 웹훅이 주된 처리 방식)
        successCallback: function(data: any) {
          console.log('결제 성공:', data);
          alert('결제가 성공적으로 완료되었습니다! 서비스를 이용해 주세요.');
          // 여기에 사용자 구독 상태 업데이트 (UI), 리다이렉션 등 클라이언트 측 로직 추가
          // (주의: 보안상 중요한 구독 상태 업데이트는 반드시 백엔드 웹훅(paddleWebhook)에서 처리해야 합니다.)
        },
        closeCallback: function(data: any) {
          console.log('결제 창 닫힘:', data);
          // 사용자가 결제 창을 닫았을 때 처리할 로직
        }
      });
    } else {
      console.error("Paddle SDK가 로드되지 않았습니다. window.Paddle 객체를 찾을 수 없습니다.");
      alert("결제 시스템을 로드하는 데 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  return (
    <div className="App">
      <h1>AI 설교 도우미</h1>
      <input type="text" placeholder="예: '사랑'에 대한 성경적 의미와 설교 아이디어" />
      <button>답변 받기</button>

      <br /><br />
      <h2>구독하여 프리미엄 기능을 사용하세요!</h2>
      <button onClick={() => openPaddleCheckout(MONTHLY_PRICE_ID)}>
        월간 구독하기 (USD $25/월)
      </button>
      <br /><br />
      <button onClick={() => openPaddleCheckout(ANNUAL_PRICE_ID)}>
        연간 구독하기 (USD $270/년 - 2개월 할인!)
      </button>

      {/* 앱의 나머지 콘텐츠를 여기에 추가하세요. */}
    </div>
  );
}

export default App;
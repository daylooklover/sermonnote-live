import React, { useState, useEffect } from 'react';
import { useId } from 'react';

// TypeScript 오류를 해결하기 위해 전역 Window 인터페이스에 Paddle을 선언합니다.
declare global {
  interface Window {
    Paddle: any;
  }
}

// Paddle SDK 스크립트를 비동기적으로 로드합니다.
// 이 스크립트는 컴포넌트가 렌더링될 때 한 번만 로드됩니다.
const loadPaddleScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/paddle.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Subscription = () => {
  const [isPaddleLoaded, setIsPaddleLoaded] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const id = useId();

  // Paddle.js 스크립트가 로드되면 초기화를 진행합니다.
  useEffect(() => {
    loadPaddleScript().then((success) => {
      if (success) {
        // Paddle 클라이언트 측 라이브러리를 초기화합니다.
        // 여기에 여러분의 실제 Paddle 판매자 ID를 입력해야 합니다.
        // 이 값은 Paddle 대시보드의 "Developer tools > Authentication"에서 찾을 수 있습니다.
        if (window.Paddle) {
          window.Paddle.Setup({
            seller: 'YOUR_PADDLE_VENDOR_ID', // <-- 여기에 실제 판매자 ID 입력
            // sandbox 옵션은 테스트 환경에서만 사용하세요.
            // 'env'가 'sandbox'로 설정되어 있으면 실제 결제가 이루어지지 않습니다.
            env: 'sandbox',
          });
          setIsPaddleLoaded(true);
        }
      } else {
        setError('Paddle SDK를 로드하는 데 실패했습니다. 네트워크 설정을 확인하세요.');
      }
    });
  }, []);

  // 결제 버튼을 클릭했을 때 실행되는 함수입니다.
  const handleCheckout = () => {
    if (!isPaddleLoaded) {
      setError('Paddle SDK가 아직 로드되지 않았습니다.');
      return;
    }
    
    // Paddle 결제 오버레이를 엽니다.
    // 여기에 여러분의 실제 'priceId'를 입력해야 합니다.
    // Paddle 대시보드에서 'Product'에 대한 'Price'를 확인하세요.
    window.Paddle.Checkout.open({
      // items: [{ priceId: 'pri_01g59m8k74c3y3246' }], // 예시
      items: [{ priceId: 'YOUR_PADDLE_PRICE_ID' }], // <-- 여기에 실제 Price ID 입력
      customer: {
        email: 'customer@example.com', // <-- Firebase 인증 사용자의 이메일로 대체하세요.
      },
      settings: {
        // 성공적인 결제 후 리다이렉션될 URL을 설정할 수 있습니다.
        // successUrl: 'https://yourwebsite.com/checkout/success'
      },
      // 결제 성공 시 발생하는 이벤트 핸들러입니다.
      // 실제 구독 정보 업데이트는 서버(Firebase Functions)에서 웹훅을 통해 처리됩니다.
      success: (data) => {
        setMessage('결제가 완료되었습니다! 잠시 후 구독 정보가 업데이트됩니다.');
        console.log('결제 성공:', data);
      },
      close: () => {
        console.log('결제 창이 닫혔습니다.');
      },
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 font-inter">
      <div className="p-8 bg-white rounded-xl shadow-lg w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">프리미엄 구독</h1>
        <p className="text-gray-600 mb-6">
          설교 보조 AI의 모든 기능을 무제한으로 사용하세요.
        </p>
        
        {/* 결제 버튼 */}
        <button
          onClick={handleCheckout}
          className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 disabled:opacity-50"
          disabled={!isPaddleLoaded}
        >
          {isPaddleLoaded ? '결제하고 시작하기' : '로딩 중...'}
        </button>

        {/* 메시지 및 오류 표시 */}
        {message && (
          <div className="mt-4 p-4 text-green-700 bg-green-100 rounded-lg">
            {message}
          </div>
        )}
        {error && (
          <div className="mt-4 p-4 text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscription;

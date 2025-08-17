'use client';

import React from 'react';

const TermsOfServicePage = () => {
  return (
    <div className="bg-gray-900 text-gray-300 min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-white mb-8">sermonnote.net 이용약관</h1>
        
        <div className="bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700">
          <p className="text-sm leading-relaxed mb-6">
            이 이용약관은 sermonnote.net(이하 "앱")가 제공하는 모든 서비스의 이용 조건 및 절차, 회원과 앱의 권리 및 의무 등 기본적인 사항을 규정합니다. 본 약관에 동의하는 것은 앱 서비스를 이용하는 모든 회원에게 적용됩니다.
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">제1조 (목적)</h2>
          <p className="text-sm mb-2">
            본 약관은 회원들이 sermonnote.net 서비스를 이용함에 있어 필요한 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">제2조 (용어의 정의)</h2>
          <p className="text-sm mb-2">
            본 약관에서 사용하는 주요 용어의 정의는 다음과 같습니다.
          </p>
          <ul className="text-sm list-disc list-inside space-y-1">
            <li>회원: 앱에 접속하여 본 약관에 따라 서비스를 이용하는 사용자</li>
            <li>서비스: sermonnote.net가 제공하는 설교 노트 작성, AI 기반 설교 보조, 음성 메모 등 모든 기능</li>
            <li>콘텐츠: 회원이 앱을 통해 생성, 입력, 업로드하는 모든 정보 및 자료</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">제3조 (약관의 효력 및 변경)</h2>
          <p className="text-sm mb-2">
            본 약관은 앱 서비스 화면에 게시하거나 기타 방법으로 회원에게 공지함으로써 효력이 발생합니다. 앱은 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 공지 후 7일이 경과한 날로부터 효력이 발생합니다.
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">제4조 (회원가입)</h2>
          <p className="text-sm mb-2">
            회원은 앱이 정한 가입 양식에 따라 정보를 기입한 후 본 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다. 앱은 회원가입 신청에 대해 승낙하며, 가입 승낙 시점부터 회원의 자격이 부여됩니다.
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">제5조 (서비스의 이용 및 제한)</h2>
          <p className="text-sm mb-2">
            회원은 본 약관 및 앱이 정한 운영 정책에 따라 서비스를 이용할 수 있습니다. 다음 각 호에 해당하는 경우 서비스 이용이 제한될 수 있습니다.
          </p>
          <ul className="text-sm list-disc list-inside space-y-1">
            <li>타인의 개인정보를 도용하거나 허위 정보를 등록한 경우</li>
            <li>앱의 운영을 방해하거나 서비스에 지장을 초래한 경우</li>
            <li>법령 및 본 약관을 위반한 경우</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">제6조 (콘텐츠의 저작권)</h2>
          <p className="text-sm mb-2">
            회원이 앱을 통해 작성하거나 업로드한 콘텐츠에 대한 저작권은 해당 회원에게 귀속됩니다. 단, 앱은 서비스 운영 및 개선, 홍보 등을 위해 회원의 동의를 받아 해당 콘텐츠를 이용할 수 있습니다.
          </p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">제7조 (면책 조항)</h2>
          <p className="text-sm mb-2">
            앱은 천재지변 또는 이에 준하는 불가항력으로 인해 서비스를 제공할 수 없는 경우, 서비스 제공에 관한 책임이 면제됩니다. 또한, 회원의 귀책사유로 인한 서비스 이용의 장애에 대해서는 책임을 지지 않습니다.
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">제8조 (관할 법원)</h2>
          <p className="text-sm mb-2">
            서비스 이용과 관련하여 분쟁이 발생할 경우, 앱과 회원 간 합의를 통해 해결하며, 합의가 이루어지지 않을 경우 관련 법령에 따른 법원을 관할 법원으로 합니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;

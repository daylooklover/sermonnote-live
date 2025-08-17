'use client';

import React from 'react';

const PrivacyPolicyPage = () => {
  return (
    <div className="bg-gray-900 text-gray-300 min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-white mb-8">개인정보 처리방침</h1>
        
        <div className="bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700">
          <p className="text-sm leading-relaxed mb-6">
            sermonnote.net(&apos;이하 앱&apos;)는 이용자의 개인정보를 매우 중요하게 생각하며, 「개인정보 보호법」 및 관련 법령을 준수하고 있습니다. 본 처리방침은 앱이 이용자의 개인정보를 어떤 목적으로, 어떻게 수집 및 이용하며, 안전하게 관리하는지 설명합니다. 본 문서는 법률 전문가의 검토를 거쳐야 하며, 실제 법적 효력을 갖기 위해서는 공식적인 절차가 필요합니다.
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">제1조 (수집하는 개인정보 항목 및 수집 방법)</h2>
          <p className="text-sm mb-2">
            sermonnote.net는 서비스 제공을 위해 아래와 같은 개인정보를 수집합니다.
          </p>
          <ul className="text-sm list-disc list-inside space-y-1">
            <li>회원 식별 정보(Firebase User ID), 접속 IP 정보, 서비스 이용 기록 (필수)</li>
            <li>사용자가 앱에 직접 입력하는 노트 내용, 음성 메모 및 텍스트 정보 (선택)</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">제2조 (개인정보의 수집 및 이용 목적)</h2>
          <p className="text-sm mb-2">
            수집한 개인정보는 다음의 목적으로 활용합니다.
          </p>
          <ul className="text-sm list-disc list-inside space-y-1">
            <li>서비스 제공: 사용자 인증, 노트 작성 및 저장, 맞춤형 기능 제공</li>
            <li>회원 관리: 본인 확인, 비인가 사용 방지, 불만 처리</li>
            <li>서비스 개선: 통계적 분석을 통한 서비스 품질 향상 및 신규 기능 개발</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">제3조 (개인정보의 제3자 제공 및 위탁)</h2>
          <p className="text-sm mb-2">
            이용자의 동의 없이 개인정보를 외부에 제공하지 않습니다. 다만, 서비스 제공을 위해 아래와 같이 업무를 위탁하고 있습니다.
          </p>
          <ul className="text-sm list-disc list-inside space-y-1">
            <li>위탁 대상: Google Firebase</li>
            <li>위탁 업무: 데이터베이스(Firestore)를 활용한 사용자 노트 및 정보 저장, 관리, 인증</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">제4조 (정보주체 권리 및 행사 방법)</h2>
          <p className="text-sm mb-2">
            이용자는 「개인정보 보호법 3차 개정안」에 따라 다음과 같은 권리를 행사할 수 있습니다.
          </p>
          <ul className="text-sm list-disc list-inside space-y-1">
            <li>개인정보 열람·정정·삭제 요구권</li>
            <li>개인정보 전송요구권: 자신의 개인정보를 다른 서비스로 이전하도록 요구할 권리</li>
            <li>자동화된 결정에 대한 거부권 및 설명 요구권</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">제5조 (개인정보의 파기)</h2>
          <p className="text-sm mb-2">
            개인정보는 수집 및 이용 목적이 달성된 후에는 지체 없이 파기합니다.
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">제6조 (개인정보 보호 책임자)</h2>
          <p className="text-sm mb-2">
            개인정보 처리에 관한 문의, 불만 처리 등은 아래 담당자에게 연락할 수 있습니다.
          </p>
          <ul className="text-sm list-disc list-inside space-y-1">
            <li>성명: [Hwangikim]</li>
            <li>연락처: [mmca333@naver.com]</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;

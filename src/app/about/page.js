'use client';

import React from 'react';

const AboutPage = () => {
  return (
    <div className="bg-gray-900 text-gray-300 min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-white mb-8">SermonNote에 대해</h1>
        
        <div className="bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700 space-y-8">
          
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">우리의 이야기</h2>
            <p className="text-lg">
              SermonNote는 단순한 노트 앱을 넘어, 목회자와 신학생, 소그룹 리더들의 설교 준비 과정을 돕기 위해 만들어진 플랫폼입니다. 우리는 기술이 하나님의 말씀에 대한 깊은 연구와 영적인 통찰을 정리하는 데 강력한 도구가 될 수 있다고 믿습니다. 복잡한 설교 준비 과정을 효율적으로 만들고, 영감이 떠오르는 순간을 놓치지 않도록 돕는 것이 SermonNote의 시작입니다.
            </p>
          </section>

          <hr className="border-gray-700" />

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">우리의 사명</h2>
            <p className="text-lg">
              우리의 사명은 기술을 활용하여 성경 연구와 설교 준비 과정을 더욱 조직적이고 통찰력 있게 만드는 것입니다. 특히, 선교 현장에서 말씀을 전하는 분들이 효율적으로 준비할 수 있도록 돕는 데 중점을 둡니다. AI 보조 기능을 통해 고대 성경 텍스트와 현대적인 삶의 연결점을 탐구하도록 돕고, 안전한 시스템으로 여러분의 영적인 통찰이 항상 안전하게 보관되고 접근 가능하도록 보장합니다.
            </p>
          </section>
          
          <hr className="border-gray-700" />

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">우리의 팀</h2>
            <p className="text-lg">
              SermonNote는 설교 준비의 어려움을 직접 경험했던 한 명의 개발자가 시작한 프로젝트입니다. 우리는 기술과 신앙의 조화를 통해 더 나은 서비스를 만들어 가고 있으며, 앞으로도 사용자들의 목소리에 귀 기울여 계속 발전해 나갈 것입니다.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default AboutPage;

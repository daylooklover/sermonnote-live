// src/app/contact/page.js
import React from 'react';

const ContactPage = () => {
  return (
    <div className="bg-gray-900 text-gray-300 min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-4xl font-extrabold text-white mb-8 text-center">문의하기</h1>
        
        <div className="bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700">
          <p className="mb-6 text-center text-lg">
            SermonNote에 대한 궁금한 점이나 제안할 내용이 있으시면 아래 양식을 통해 알려주세요.
          </p>

          <form action="#" method="POST" className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-400">이름</label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="block w-full rounded-md border-gray-700 bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-white p-3"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-400">이메일 주소</label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-md border-gray-700 bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-white p-3"
                />
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-400">메시지</label>
              <div className="mt-1">
                <textarea
                  id="message"
                  name="message"
                  rows="4"
                  required
                  className="block w-full rounded-md border-gray-700 bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-white p-3"
                ></textarea>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
              >
                메시지 보내기
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
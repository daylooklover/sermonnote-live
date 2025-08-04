import React, {useState, useEffect} from "react";
import {initializeApp} from "firebase/app";
import {getFunctions, httpsCallable, HttpsCallableResult, connectFunctionsEmulator} from "firebase/functions";
import {useId} from "react";

// 중요: 실제 Firebase 프로젝트 설정 값으로 교체하세요.
// 이 값들은 Firebase 콘솔의 "프로젝트 설정" -> "내 앱"에서 찾을 수 있습니다.
// 이 값을 채우지 않으면 Firebase SDK가 초기화되지 않아 함수 호출이 실패합니다.
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY", // <-- 실제 API Key
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
};

// Firebase 앱 초기화
let app: any;
let functionsInstance: any;
try {
    // firebaseConfig에 필수 필드가 채워져 있는지 확인합니다.
    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
        app = initializeApp(firebaseConfig);
        functionsInstance = getFunctions(app);

        // 로컬 개발 환경에서만 에뮬레이터를 사용합니다.
        // 실서버 배포 시에는 이 코드를 주석 처리하거나 제거해야 합니다.
        // connectFunctionsEmulator(functionsInstance, "127.0.0.1", 5001);
    } else {
        console.error("오류: Firebase 설정이 유효하지 않습니다. firebaseConfig의 필수 필드가 비어있습니다.");
    }
} catch (error) {
    console.error("오류: Firebase 앱 초기화 중 문제가 발생했습니다.", error);
}

// generateSermonAid 함수의 예상 응답 타입 정의
interface SermonAidResponseData {
    response: string;
}

// Firebase Function 호출을 위한 Callable 함수 참조
const generateSermonAidCallable = functionsInstance ?
    httpsCallable<any, SermonAidResponseData>(functionsInstance, "generateSermonAid") :
    null;

// 메인 애플리케이션 컴포넌트
const SermonAid = () => {
    const [query, setQuery] = useState<string>("");
    const [response, setResponse] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const queryId = useId();

    // 컴포넌트 마운트 시 Firebase callable 함수가 유효한지 확인하는 useEffect
    useEffect(() => {
        if (!generateSermonAidCallable) {
            setError("Firebase Functions가 올바르게 초기화되지 않았거나 설정이 부족합니다. 설정을 확인해주세요.");
        }
    }, []);

    // 질문 전송 핸들러
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setResponse("");

        if (!generateSermonAidCallable) {
            setError("AI 서비스에 연결할 수 없습니다. 관리자에게 문의하세요.");
            return;
        }

        if (query.trim() === "") {
            setError("질문을 입력해주세요.");
            return;
        }

        setIsLoading(true);

        try {
            // Firebase Function 호출
            const result: HttpsCallableResult<SermonAidResponseData> = await generateSermonAidCallable({query: query});

            // 응답 데이터 확인 및 상태 업데이트
            if (result.data && typeof result.data.response === "string") {
                setResponse(result.data.response);
            } else {
                setError("AI로부터 유효한 답변을 받지 못했습니다.");
                console.error("예상치 못한 AI 응답 형식:", result.data);
            }
        } catch (err: any) {
            console.error("Firebase Function 호출 오류:", err);
            if (err.code && err.message) {
                setError(`오류 발생 (${err.code}): ${err.message}`);
            } else {
                setError(`오류 발생: ${err.message || "알 수 없는 오류"}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-inter">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
                <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                    AI 설교 도우미
                </h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor={queryId} className="block text-gray-700 text-sm font-semibold mb-2">
                            질문을 입력하세요:
                        </label>
                        <textarea
                            id={queryId}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 resize-y min-h-[100px]"
                            placeholder="예: '사랑에 대한 성경적 의미와 설교 아이디어를 알려주세요.' 또는 '마태복음 5장 13절(세상의 소금)에 대한 주석을 부탁드립니다.'"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            disabled={isLoading}
                        ></textarea>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition duration-300 ease-in-out font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading}
                    >
                        {isLoading ? "답변 생성 중..." : "답변 받기"}
                    </button>
                </form>

                {error && (
                    <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                        <p className="font-semibold">오류:</p>
                        <p>{error}</p>
                    </div>
                )}

                {response && (
                    <div className="mt-6 p-6 bg-blue-50 border border-blue-200 text-gray-800 rounded-md whitespace-pre-wrap shadow-inner">
                        <h2 className="text-xl font-bold text-blue-800 mb-3">AI 답변:</h2>
                        <p>{response}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SermonAid;

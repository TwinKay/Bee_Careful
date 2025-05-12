import LoginForm from './LoginForm';

const Login = () => {
  return (
    <div className="w-full max-w-md px-4">
      <div className="mb-8 flex flex-col items-center">
        <img src="/icons/beecareful-logo.svg" alt="비케어풀 로고" className="mb-4 w-64" />
        <h1 className="font-ygJalnan text-5xl font-bold text-bc-brown-90">비케어풀</h1>
        <p className="mt-2 text-xl font-semibold text-bc-brown-60">꿀벌 통합 관리 시스템</p>
      </div>
      <div className="w-full">
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;

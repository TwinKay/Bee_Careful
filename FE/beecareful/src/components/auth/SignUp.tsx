import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import SignUpForm from './SignUpForm';

const SignUp = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="w-full max-w-md px-6">
      <div className="mb-12 flex flex-col items-start">
        <p className="mt-2 text-2xl font-bold text-bc-brown-100">안녕하세요!</p>
        <p className="text-2xl font-bold text-bc-brown-100">비케어풀 사용을 위해</p>
        <p className="text-2xl font-bold text-bc-brown-100">회원가입을 진행해주세요</p>
      </div>

      <SignUpForm onGoBack={handleGoBack} />
    </div>
  );
};

export default SignUp;

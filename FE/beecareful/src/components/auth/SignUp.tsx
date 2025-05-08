import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { Button } from '@/components/common/Button';

type SignupFormType = {
  username: string;
  password: string;
  passwordConfirm: string;
  name: string;
  phone: string;
};

const Signup = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, touchedFields },
  } = useForm<SignupFormType>({
    mode: 'onBlur', // 입력 필드에서 포커스가 빠져나갈 때만 유효성 검사
    reValidateMode: 'onBlur', // 재검증도 blur 시에만 수행
  });

  // 모든 필드가 채워졌는지 확인
  const allFields = watch();

  useEffect(() => {
    // 모든 필드가 입력되었고 에러가 없는지 확인
    const allFieldsFilled = Object.values(allFields).every(
      (value) => value && value.toString().trim() !== '',
    );
    setIsFormValid(allFieldsFilled && Object.keys(errors).length === 0);
  }, [allFields, errors]);

  // 비밀번호 확인을 위해 현재 비밀번호 값 감시
  const password = watch('password');

  const onSubmit = async (data: SignupFormType) => {
    try {
      setIsLoading(true);
      setError(null);
      /**
       * @todo API 회원가입 처리 구현 필요
       */
      console.log(data);
      // 회원가입 성공 시 로그인 페이지로 이동
      navigate(ROUTES.LOGIN);
    } catch (err) {
      setError('회원가입에 실패했습니다. 다시 시도해주세요.');
      console.error('Signup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md px-6">
        <div className="mb-12 mt-8 flex flex-col items-start">
          <p className="text-bc-brown-100 mt-2 text-2xl font-bold">안녕하세요!</p>
          <p className="text-bc-brown-100 text-2xl font-bold">비케어풀 사용을 위해</p>
          <p className="text-bc-brown-100 text-2xl font-bold">회원가입을 진행해주세요</p>
        </div>

        <div className="w-full">
          {error && <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">{error}</div>}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div>
              <input
                type="text"
                placeholder="아이디"
                className={`w-full rounded-2xl p-4 text-lg focus:outline-none ${
                  errors.username && touchedFields.username
                    ? 'border-2 border-red-500 focus:border-red-500'
                    : 'focus:border-amber-500'
                }`}
                {...register('username', {
                  required: '아이디를 입력해주세요',
                  minLength: { value: 4, message: '아이디는 최소 4자 이상이어야 합니다' },
                })}
              />
              {errors.username && touchedFields.username && (
                <p className="ml-1 mt-2 text-start text-sm text-red-500">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <input
                type="password"
                placeholder="비밀번호"
                className={`w-full rounded-2xl p-4 text-lg focus:outline-none ${
                  errors.password && touchedFields.password
                    ? 'border-2 border-red-500 focus:border-red-500'
                    : 'focus:border-amber-500'
                }`}
                {...register('password', {
                  required: '비밀번호를 입력해주세요',
                  minLength: { value: 8, message: '비밀번호는 최소 8자 이상이어야 합니다' },
                })}
              />
              {errors.password && touchedFields.password && (
                <p className="ml-1 mt-2 text-start text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <input
                type="password"
                placeholder="비밀번호 확인"
                className={`w-full rounded-2xl p-4 text-lg focus:outline-none ${
                  errors.passwordConfirm && touchedFields.passwordConfirm
                    ? 'border-2 border-red-500 focus:border-red-500'
                    : 'focus:border-amber-500'
                }`}
                {...register('passwordConfirm', {
                  required: '비밀번호 확인을 입력해주세요',
                  validate: (value) => value === password || '비밀번호가 일치하지 않습니다',
                })}
              />
              {errors.passwordConfirm && touchedFields.passwordConfirm && (
                <p className="ml-1 mt-2 text-start text-sm text-red-500">
                  {errors.passwordConfirm.message}
                </p>
              )}
            </div>

            <div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="이름"
                  className={`w-full rounded-2xl p-4 text-lg focus:outline-none ${
                    errors.name && touchedFields.name
                      ? 'border-2 border-red-500 focus:border-red-500'
                      : 'focus:border-amber-500'
                  }`}
                  {...register('name', {
                    required: '이름을 입력해주세요',
                    pattern: {
                      value: /^[0-9]+$/,
                      message: '이름은 한글 혹은 영문만 입력 가능합니다',
                    },
                  })}
                />
                {errors.name && touchedFields.name && (
                  <p className="ml-1 mt-2 text-start text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
            </div>

            <div>
              <input
                type="tel"
                placeholder="휴대폰 번호"
                className={`w-full rounded-2xl p-4 text-lg focus:outline-none ${
                  errors.phone && touchedFields.phone
                    ? 'border-2 border-red-500 focus:border-red-500'
                    : 'focus:border-amber-500'
                }`}
                {...register('phone', {
                  required: '전화번호를 입력해주세요',
                  pattern: {
                    value: /^[0-9]{3}-[0-9]{3,4}-[0-9]{4}$/,
                    message: '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)',
                  },
                })}
              />
              {errors.phone && touchedFields.phone && (
                <p className="ml-1 mt-2 text-start text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>

            {/* 버튼 여백 설정 */}
            <div className="mt-12">
              <Button
                type="submit"
                variant="success"
                size="lg"
                fullWidth
                isLoading={isLoading}
                disabled={!isFormValid}
                className="opacity-100 disabled:opacity-50"
              >
                회원가입
              </Button>
            </div>

            <div className="mb-8">
              <Button variant="secondary" size="lg" fullWidth onClick={handleGoBack}>
                뒤로가기
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;

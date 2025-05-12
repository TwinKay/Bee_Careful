import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { Button } from '@/components/common/Button';
import { useSignup } from '@/services/auth';
import { AxiosError } from 'axios';
import { formatPhoneNumber, removeHyphenFromPhone } from '@/utils/format';

type SignupFormType = {
  username: string;
  password: string;
  passwordConfirm: string;
  name: string;
  phone: string;
};

type SignUpFormPropsType = {
  onGoBack: () => void;
};

const SignUpForm = ({ onGoBack }: SignUpFormPropsType) => {
  const navigate = useNavigate();
  const [isFormValid, setIsFormValid] = useState(false);

  const signupMutation = useSignup();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, touchedFields },
  } = useForm<SignupFormType>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });

  // 모든 필드가 채워졌는지 확인
  const allFields = watch();
  const password = watch('password');
  const phone = watch('phone');

  useEffect(() => {
    // 모든 필드가 입력되었고 에러가 없는지 확인
    const allFieldsFilled = Object.values(allFields).every(
      (value) => value && value.toString().trim() !== '',
    );
    setIsFormValid(allFieldsFilled && Object.keys(errors).length === 0);
  }, [allFields, errors]);

  useEffect(() => {
    if (phone) {
      const formattedPhone = formatPhoneNumber(phone);

      if (formattedPhone !== phone) {
        setValue('phone', formattedPhone, { shouldValidate: false });
      }
    }
  }, [phone, setValue]);

  // 회원가입 API 호출
  const onSubmit = async (data: SignupFormType) => {
    try {
      const requestData = {
        memberLoginId: data.username,
        password: data.password,
        memberName: data.name,
        phone: removeHyphenFromPhone(data.phone),
      };

      await signupMutation.mutateAsync(requestData);

      // 로그인 페이지로 이동하면서 회원가입 성공 메시지 전달
      navigate(ROUTES.LOGIN, {
        state: {
          showToast: true,
          toastMessage: '회원가입이 완료되었습니다',
          toastType: 'success',
        },
      });
    } catch {
      // 실패 시 로컬에서 처리
    }
  };

  // 값이 있고 유효하지 않을 때만 오류 표시
  const shouldShowError = (fieldName: keyof SignupFormType) => {
    return errors[fieldName] && touchedFields[fieldName] && allFields[fieldName] !== '';
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div>
        <input
          type="text"
          placeholder="아이디"
          className={`w-full rounded-2xl p-4 text-lg focus:outline-none ${
            shouldShowError('username') || signupMutation.isError
              ? 'border-2 border-red-500 focus:border-red-500'
              : 'focus:border-amber-500'
          }`}
          {...register('username', {
            required: '아이디를 입력해주세요',
            minLength: { value: 4, message: '아이디는 최소 4자 이상이어야 합니다' },
            pattern: {
              value: /^[a-z0-9]+$/,
              message: '아이디는 영문 소문자, 숫자만 사용 가능합니다',
            },
          })}
        />
        {shouldShowError('username') && (
          <p className="ml-1 mt-2 text-start text-sm text-red-500">{errors.username?.message}</p>
        )}
        {/* API 에러 메시지 표시 */}
        {signupMutation.isError && !shouldShowError('username') && (
          <p className="ml-1 mt-2 text-start text-sm text-red-500">
            {signupMutation.error instanceof AxiosError &&
            signupMutation.error.response?.data?.message
              ? signupMutation.error.response.data.message
              : '회원가입에 실패했습니다. 다시 시도해주세요.'}
          </p>
        )}
      </div>

      <div>
        <input
          type="password"
          placeholder="비밀번호"
          className={`w-full rounded-2xl p-4 text-lg focus:outline-none ${
            shouldShowError('password')
              ? 'border-2 border-red-500 focus:border-red-500'
              : 'focus:border-amber-500'
          }`}
          {...register('password', {
            required: '비밀번호를 입력해주세요',
            minLength: { value: 8, message: '비밀번호는 최소 8자 이상이어야 합니다' },
            pattern: {
              value: /^[A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/,
              message: '비밀번호는 영문 대소문자, 숫자, 특수문자만 사용 가능합니다',
            },
          })}
        />
        {shouldShowError('password') && (
          <p className="ml-1 mt-2 text-start text-sm text-red-500">{errors.password?.message}</p>
        )}
      </div>

      <div>
        <input
          type="password"
          placeholder="비밀번호 확인"
          className={`w-full rounded-2xl p-4 text-lg focus:outline-none ${
            shouldShowError('passwordConfirm')
              ? 'border-2 border-red-500 focus:border-red-500'
              : 'focus:border-amber-500'
          }`}
          {...register('passwordConfirm', {
            required: '비밀번호 확인을 입력해주세요',
            validate: (value) => value === password || '비밀번호가 일치하지 않습니다',
          })}
        />
        {shouldShowError('passwordConfirm') && (
          <p className="ml-1 mt-2 text-start text-sm text-red-500">
            {errors.passwordConfirm?.message}
          </p>
        )}
      </div>

      <div>
        <div className="relative">
          <input
            type="text"
            placeholder="이름"
            className={`w-full rounded-2xl p-4 text-lg focus:outline-none ${
              shouldShowError('name')
                ? 'border-2 border-red-500 focus:border-red-500'
                : 'focus:border-amber-500'
            }`}
            {...register('name', {
              required: '이름을 입력해주세요',
              pattern: {
                value: /^[가-힣a-zA-Z]+$/,
                message: '이름은 한글 혹은 영문만 입력 가능합니다',
              },
            })}
          />
          {shouldShowError('name') && (
            <p className="ml-1 mt-2 text-start text-sm text-red-500">{errors.name?.message}</p>
          )}
        </div>
      </div>

      <div>
        <input
          type="tel"
          placeholder="휴대폰 번호"
          className={`w-full rounded-2xl p-4 text-lg focus:outline-none ${
            shouldShowError('phone')
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
        {shouldShowError('phone') && (
          <p className="ml-1 mt-2 text-start text-sm text-red-500">{errors.phone?.message}</p>
        )}
      </div>

      {/* 버튼 여백 설정 */}
      <div className="mt-12">
        <Button
          type="submit"
          variant="success"
          size="lg"
          fullWidth
          isLoading={signupMutation.isPending}
          disabled={!isFormValid}
          className="opacity-100 disabled:opacity-50"
        >
          회원가입
        </Button>
      </div>

      <div className="mb-8">
        <Button variant="secondary" size="lg" fullWidth onClick={onGoBack}>
          뒤로가기
        </Button>
      </div>
    </form>
  );
};

export default SignUpForm;

import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthLayout } from './AuthLayout';
import { updatePassword } from './api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface FormValues {
  password: string;
  confirmPassword: string;
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const onSubmit = async (values: FormValues) => {
    try {
      await updatePassword(values.password);
      toast.success('Password updated. You can now sign in.');
      navigate('/auth/login', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update password.');
    }
  };

  return (
    <AuthLayout title="Set a new password">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 8, message: 'At least 8 characters' },
          })}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (value) => value === watch('password') || 'Passwords do not match',
          })}
        />
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Update password
        </Button>
      </form>
    </AuthLayout>
  );
}

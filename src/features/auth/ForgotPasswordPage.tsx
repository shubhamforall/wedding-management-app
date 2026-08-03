import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { MailCheck } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { sendPasswordReset } from './api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface FormValues {
  email: string;
}

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const onSubmit = async (values: FormValues) => {
    try {
      await sendPasswordReset(values.email);
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send reset email.');
    }
  };

  if (sent) {
    return (
      <AuthLayout title="Check your inbox">
        <div className="flex flex-col items-center gap-3 text-center">
          <MailCheck className="h-10 w-10 text-primary" strokeWidth={1.5} />
          <p className="text-sm text-text-muted">
            If an account exists for that email, we&apos;ve sent a link to reset your password.
          </p>
          <Link to="/auth/login" className="text-sm font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset your password" subtitle="We'll email you a reset link">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email', { required: 'Email is required' })}
        />
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Send reset link
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-text-muted">
        <Link to="/auth/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

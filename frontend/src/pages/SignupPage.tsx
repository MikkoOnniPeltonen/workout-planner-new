import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { passwordRules, type SignupInput, signupSchema } from '@workout-planner/shared';
import { Check, Circle } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { AuthCard } from '@/components/auth/AuthCard';
import { Button } from '@/components/ui/button';
import { FormError, FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth.context';
import { getErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';
import authService from '@/services/auth.service';

function PasswordRules({ password, showErrors }: { password: string; showErrors: boolean }) {
  return (
    <ul id="password-rules" className="grid gap-1 text-sm sm:grid-cols-2">
      {passwordRules.map((rule) => {
        const met = rule.test(password);
        return (
          <li
            key={rule.label}
            data-met={met}
            className={cn(
              'flex items-center gap-2',
              met ? 'text-primary' : showErrors ? 'text-red-400' : 'text-muted-foreground',
            )}
          >
            {met ? (
              <Check className="size-4 shrink-0" aria-hidden="true" />
            ) : (
              <Circle className="size-4 shrink-0" aria-hidden="true" />
            )}
            <span>{rule.label}</span>
            <span className="sr-only">{met ? '(done)' : '(missing)'}</span>
          </li>
        );
      })}
    </ul>
  );
}

function SignupPage() {
  const { logIn } = useAuth();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '' },
  });
  const password = useWatch({ control, name: 'password' });
  // New accounts are logged in straight away; the auth guard then redirects to the dashboard.
  const signup = useMutation({
    mutationFn: (input: SignupInput) => authService.signup(input),
    onSuccess: logIn,
  });

  return (
    <AuthCard
      title="Create an account"
      description="Plan workouts, log your sessions and see real progress."
      footer={
        <>
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      <form
        noValidate
        className="space-y-4"
        onSubmit={handleSubmit((input) => signup.mutate(input))}
      >
        <FormField label="Name" htmlFor="name" error={errors.name?.message}>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Your name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'name-error' : undefined}
            {...register('name')}
          />
        </FormField>
        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
          />
        </FormField>
        <FormField
          label="Password"
          htmlFor="password"
          hint={<PasswordRules password={password} showErrors={Boolean(errors.password)} />}
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby="password-rules"
            {...register('password')}
          />
        </FormField>

        {signup.isError && <FormError message={getErrorMessage(signup.error)} />}

        <Button type="submit" size="lg" className="w-full" disabled={signup.isPending}>
          {signup.isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthCard>
  );
}

export default SignupPage;

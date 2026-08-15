import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCreateWedding } from './hooks';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { WeddingSide } from '@/types/database';

interface FormValues {
  name: string;
  bride_name: string;
  groom_name: string;
  wedding_date: string;
  reception_date: string;
  venue: string;
  wedding_side: WeddingSide;
}

export function CreateWeddingPage() {
  const navigate = useNavigate();
  const createWedding = useCreateWedding();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { wedding_side: 'both' } });

  const onSubmit = async (values: FormValues) => {
    try {
      const wedding = await createWedding.mutateAsync({
        name: values.name,
        bride_name: values.bride_name,
        groom_name: values.groom_name,
        wedding_date: values.wedding_date || null,
        reception_date: values.reception_date || null,
        venue: values.venue || null,
        wedding_side: values.wedding_side,
      });
      toast.success('Wedding created!');
      navigate(`/w/${wedding.id}`, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create wedding.');
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-10">
      <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <h1 className="mb-1 text-xl font-semibold text-text">Create a wedding</h1>
      <p className="mb-6 text-sm text-text-muted">Set up the basics — you can change these later in Wedding Info.</p>

      <Card className="p-6">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Wedding Name"
            placeholder="e.g. Rahul & Priya"
            error={errors.name?.message}
            {...register('name', { required: 'Wedding name is required' })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Bride Name"
              error={errors.bride_name?.message}
              {...register('bride_name', { required: 'Required' })}
            />
            <Input
              label="Groom Name"
              error={errors.groom_name?.message}
              {...register('groom_name', { required: 'Required' })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Wedding Date" type="date" {...register('wedding_date')} />
            <Input label="Reception Date" type="date" {...register('reception_date')} />
          </div>
          <Input label="Venue" placeholder="e.g. Grand Palace Banquets" {...register('venue')} />
          <Select label="Wedding Side" {...register('wedding_side')}>
            <option value="groom">Groom</option>
            <option value="bride">Bride</option>
            <option value="both">Both</option>
          </Select>

          <Button type="submit" className="w-full" isLoading={createWedding.isPending}>
            Create wedding
          </Button>
        </form>
      </Card>
    </div>
  );
}

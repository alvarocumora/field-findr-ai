import PublicLayout from '@/components/layouts/PublicLayout';
import PublishForm from '@/components/publish/PublishForm';

const PublishProperty = () => {
  return (
    <PublicLayout showFooter={false}>
      <PublishForm />
    </PublicLayout>
  );
};

export default PublishProperty;

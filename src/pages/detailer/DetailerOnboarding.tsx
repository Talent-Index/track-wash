import { DetailerOnboardingForm } from '@/components/detailer';

// Detailer onboarding page - accessible at /detailer/onboarding
export default function DetailerOnboarding() {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container section-padding">
        <div className="max-w-md mx-auto card-elevated p-6">
          <DetailerOnboardingForm />
        </div>
      </div>
    </div>
  );
}

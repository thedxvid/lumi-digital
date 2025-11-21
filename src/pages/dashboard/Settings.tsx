
import { SettingsContent } from '@/components/dashboard/SettingsContent';

const DashboardSettings = () => {
  return (
    <div className="w-full min-h-screen overflow-y-auto px-4 sm:px-6 space-y-6 max-w-4xl mx-auto py-6 sm:py-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Configurações ⚙️
        </h1>
        <p className="text-muted-foreground">
          Personalize sua experiência com a LUMI
        </p>
      </div>

      <SettingsContent />
    </div>
  );
};

export default DashboardSettings;

import { useLicensePopup } from '@/hooks/useLicensePopup';
import { LicensePromptPopup } from './LicensePromptPopup';

export const LicensePopupManager = () => {
  const { showPopup, showLoginOption, handleClosePopup } = useLicensePopup();

  return (
    <LicensePromptPopup
      open={showPopup}
      onClose={handleClosePopup}
      showLoginOption={showLoginOption}
    />
  );
};

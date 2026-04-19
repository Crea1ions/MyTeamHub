import React from 'react';
import { ScreenLayout } from './ScreenLayout';
import { Vault } from './Vault';

export const VaultScreen: React.FC = () => (
  <ScreenLayout screen="vault">
    <Vault />
  </ScreenLayout>
);

export default VaultScreen;

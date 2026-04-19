import React from 'react';
import { ScreenLayout } from './ScreenLayout';
import { Config } from './Config';

export const ConfigScreen: React.FC = () => (
  <ScreenLayout screen="config">
    <Config />
  </ScreenLayout>
);

export default ConfigScreen;

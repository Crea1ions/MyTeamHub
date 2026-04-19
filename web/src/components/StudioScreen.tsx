import React from 'react';
import { ScreenLayout } from './ScreenLayout';
import { Studio } from './Studio';

export const StudioScreen: React.FC = () => (
  <ScreenLayout screen="studio">
    <Studio />
  </ScreenLayout>
);

export default StudioScreen;

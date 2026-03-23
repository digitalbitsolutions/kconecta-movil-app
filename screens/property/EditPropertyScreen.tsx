import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { PropertyFormProvider } from '../../components/property/form/PropertyFormContext';
import { PropertyFormLayout } from '../../components/property/form/PropertyFormLayout';

/**
 * EditPropertyScreen - Entry point for creating or editing a property.
 * Logic is modularized in components/property/form/
 */
const EditPropertyScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isEdit = !!id;

  return (
    <View style={styles.container}>
      <PropertyFormProvider initialId={id} isEdit={isEdit}>
        <PropertyFormLayout id={id} />
      </PropertyFormProvider>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
});

export default EditPropertyScreen;

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Field } from '../type';

const FIELDS_STORAGE_KEY = '@farm_fields';

// Save fields to AsyncStorage
export const saveFields = async (fields: Field[]): Promise<void> => {
  try {
    // Prepare fields for storage by removing the image property
    const fieldsForStorage = fields.map(field => {
      const { image, ...fieldWithoutImage } = field;
      return fieldWithoutImage;
    });
    await AsyncStorage.setItem(FIELDS_STORAGE_KEY, JSON.stringify(fieldsForStorage));
  } catch (error) {
    console.error("Error saving fields to storage:", error);
    throw error;
  }
};

// Load fields from AsyncStorage
export const loadFields = async (): Promise<Partial<Field>[]> => {
  try {
    const fieldsJson = await AsyncStorage.getItem(FIELDS_STORAGE_KEY);
    if (fieldsJson) {
      return JSON.parse(fieldsJson);
    }
    return [];
  } catch (error) {
    console.error("Error loading fields from storage:", error);
    throw error;
  }
};

// Save a single field to AsyncStorage
export const saveField = async (field: Field, existingFields: Field[]): Promise<Field[]> => {
  try {
    const updatedFields = [...existingFields, field];
    await saveFields(updatedFields);
    return updatedFields;
  } catch (error) {
    console.error("Error saving new field to storage:", error);
    throw error;
  }
};

// Delete a field from AsyncStorage
export const deleteField = async (fieldId: string, existingFields: Field[]): Promise<Field[]> => {
  try {
    const updatedFields = existingFields.filter(field => field.id !== fieldId);
    await saveFields(updatedFields);
    return updatedFields;
  } catch (error) {
    console.error("Error deleting field from storage:", error);
    throw error;
  }
};
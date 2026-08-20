import AsyncStorage from '@react-native-async-storage/async-storage';

const CIHAZ_ID_KEY = 'cihaz_id';

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getCihazId(): Promise<string> {
  let id = await AsyncStorage.getItem(CIHAZ_ID_KEY);
  if (!id) {
    id = uuidv4();
    await AsyncStorage.setItem(CIHAZ_ID_KEY, id);
  }
  return id;
}

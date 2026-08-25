import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);

// Usar la base de datos que AI Studio ya creó para este proyecto
const FIRESTORE_DB_ID = firebaseConfig.firestoreDatabaseId;

let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    },
    FIRESTORE_DB_ID
  );
} catch (e) {
  firestoreInstance = getFirestore(app, FIRESTORE_DB_ID);
}

export const db = firestoreInstance;

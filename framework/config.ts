import path from 'node:path';

/** App under test. */
export const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8000';

/**
 * Directory holding the JSON test data. Defaults to `<repo>/test-data`; point TEST_DATA_DIR
 * somewhere else to run the same tests against a different data set.
 */
export const TEST_DATA_DIR = path.resolve(process.env.TEST_DATA_DIR ?? path.join(__dirname, '..', 'test-data'));

/** localStorage key the app keeps its JWT in. */
export const TOKEN_STORAGE_KEY = 'stb_token';

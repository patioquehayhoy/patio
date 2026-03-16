/**
 * Flag para distinguir navegación del usuario desde Login vs restauración de estado.
 * Se resetea en cada apertura de la app (nueva instancia en memoria).
 */
let userNavigatedFromLogin = false;

export function setUserNavigatedFromLogin() {
  userNavigatedFromLogin = true;
}

export function getUserNavigatedFromLogin() {
  return userNavigatedFromLogin;
}

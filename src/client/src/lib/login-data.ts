export interface LoginData {
  email: string;
  password: string;
}

// transforme un FormData (tableau) en LoginData (interface)
export function parseLoginData(formData: FormData): LoginData {
  const email = formData.get('email'); // input name du formulaire
  const password = formData.get('password'); // input name du formulaire

  // est-ce que email et password sont des string ?
  if( typeof email !== "string" || typeof password !== "string" ) {
    throw new Error('Email ou mot de passe invalide');
  }

  // ici email et password sont bien de type string
  const data: LoginData = { email, password } ;

  return data;
}
<script lang="ts">
  import { parseLoginData, type LoginData } from "../lib/login-data";
  import { parseRegisterData, type RegisterData } from "../lib/register-data";
  import { api } from "../services/api";


  interface Props {
    // définition des props utilisables dans Auth.Svelte
    isConnected?: boolean;
  }
  // accède au state isConnected défini dans App.Svelte
  // isConnected prend ici une valeur par défaut à false
  let { isConnected = $bindable(false) }: Props = $props(); // $props accède aux state fournis par le parent



  async function handleSignup(event: SubmitEvent) {
    // Gérer la soumission en JavaScript sans recharger la page.
    event.preventDefault();

    const registerForm = event.target as HTMLFormElement;
    const registerFormData = new FormData(registerForm);

    try {
      // parse les données du formulaire
      const registerData: RegisterData = parseRegisterData(registerFormData);

      // envois la rquete register vers l'API
      const registered = await api.register(registerData);

      if (!registered) {
        // erreur
        alert("Erreur, données invalides");
        throw new Error("Données invalides");
      }

      // TODO remove it for prod
      // alert("Enregistrement réussi, actualiser la page");
    } catch (e: unknown) {
      console.error(String(e));
    }
  }


  

  async function handleLogin(event: SubmitEvent) {
    // Gérer la soumission en JavaScript sans recharger la page.
    event.preventDefault();

    isConnected = false; // reset de la valeur du state --> efface la liste des utilisateurs

    // récupérer les données saisies dans le formulaire
    const loginForm = event.target as HTMLFormElement;
    const loginFormData = new FormData(loginForm); // stoque les données du formulaire dans un tableau

    try {
      const loginData: LoginData = parseLoginData(loginFormData);

      // envoyer une requete vers l'API sur /auth/login
      // change la valeur du state isConnected déclaré dans App.Svelte
      isConnected = await api.login(loginData);

      // traiter le résultat de la requete
      if (!isConnected) {
        alert("Utilisateur pas connecté, recherchez la page");
        throw new Error("Pas connecté");
      }

      // TODO remove it for prod
      // alert("Utilisateur connecté, vous pouvez recharger la page");
    } catch (e: unknown) {
      // attrape l'erreur de parseLoginData
      console.log(String(e));
    }
  }
</script>

<section>
  <h2>Créer un compte</h2>
  <form onsubmit={handleSignup}>
    <label for="firstname">
      <span>Prénom :</span>
      <input
        type="text"
        placeholder="Alice"
        autocomplete="given-name"
        name="firstname"
      />
    </label>

    <label for="lastname">
      <span>Nom :</span>
      <input
        type="text"
        placeholder="Martin"
        autocomplete="family-name"
        name="lastname"
      />
    </label>

    <label for="email">
      <span>Email :</span>
      <input
        type="email"
        placeholder="alice@oquiz.test"
        autocomplete="email"
        name="email"
      />
    </label>

    <label for="password">
      <span>Mot de passe :</span>
      <input
        type="password"
        placeholder="*****"
        autocomplete="new-password"
        name="password"
      />
    </label>

    <label for="confirm">
      <span>Confirmation :</span>
      <input
        type="password"
        placeholder="*****"
        autocomplete="new-password"
        name="confirm"
      />
    </label>

    <button>S'inscrire</button>
  </form>
</section>

<section>
  <h2>Se connecter</h2>
  <form onsubmit={handleLogin}>
    <label for="email">
      <span>Email :</span>
      <input
        type="email"
        placeholder="alice@oquiz.test"
        autocomplete="email"
        name="email"
      />
    </label>

    <label for="password">
      <span>Mot de passe :</span>
      <input
        type="password"
        placeholder="*****"
        autocomplete="current-password"
        name="password"
      />
    </label>

    <button>Se connecter</button>
  </form>
</section>

<style scoped>
  label {
    margin-bottom: 1rem;
    display: block;

    span {
      display: inline-block;
      width: 120px;
    }
  }
</style>

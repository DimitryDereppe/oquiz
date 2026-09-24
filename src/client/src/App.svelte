<script lang="ts">
  import Auth from "./components/Auth.svelte";
  import { toReadableDate } from "./lib/utils";
  import { api, type UserDTO } from "./services/api";

  let users = $state<UserDTO[]>([]); // par défaut : un tableau de UserDTO vide
  let hasError = $state(false);
  let isLoading = $state(false);
  let isConnected = $state(false);

  $effect(() => {
    if (isConnected) {
      // appelle getUsers uniquement si l'utilisateur est connecté
      fetchUsers();
    }
  });

  async function fetchUsers() {
    isLoading = true;

    try {
      users = await api.getUsers();
    } catch (error) {
      console.error(error);
      hasError = true;
    } finally {
      isLoading = false;
    }
  }
</script>

<header>
  <h1>Oquiz</h1>
</header>

<main>
  <h2>Bienvenue sur Oquiz</h2>

  <p>Nous sommes le {toReadableDate(new Date())}</p>

  {#if isLoading}
    <p>Données en cours de chargement...</p>
  {/if}

  {#if hasError}
    <p>Une erreur est survenue. Merci de bien vouloir réessayer plus tard.</p>
  {/if}

  {#if !isLoading && !hasError && users.length === 0}
    <p>Aucun utilisateur trouvé.</p>
  {/if}

  {#if users.length > 0}
    <h2>Liste des utilisateurs</h2>
    <ul>
      {#each users as user}
        <li>{user.firstname}</li>
      {/each}
    </ul>
  {/if}

  <Auth bind:isConnected />
</main>

<footer>
  Oquiz - {new Date().getFullYear()}
</footer>

<style lang="css" scoped>
  h1 {
    text-decoration: underline;
  }

  footer {
    padding-top: 2rem;
  }
</style>

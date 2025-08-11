<template>
  <footer>
    <p class="attribution">
      Criado por <a href="https://github.com/torresds" target="_blank" rel="noopener noreferrer">Miguel</a>
    </p>
  </footer>
</template>

<style scoped>
footer {
  text-align: center;
  margin-top: 4rem;
  padding: 2rem;
  background-color: #e9ecef;
  border-radius: var(--border-radius);
  color: var(--text-light);
  font-size: 0.9rem;
}

footer p {
  margin: 0;
}

footer .attribution a {
  color: var(--ufjf-blue);
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.2s;
}

footer .attribution a:hover {
  text-decoration: underline;
}
</style>

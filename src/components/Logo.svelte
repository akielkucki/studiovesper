<script>
  let { mark = false } = $props()
</script>

<span class="logo">
  <svg class="logo__mark" viewBox="0 0 40 40" aria-hidden="true">
    <path
      d="M9 0H13.4L18.3 20.9Q20 26.4 21.7 20.9L26.6 0H31A9 9 0 0 1 40 9V31A9 9 0 0 1 31 40H9A9 9 0 0 1 0 31V9A9 9 0 0 1 9 0Z"
    />
  </svg>
  {#if !mark}
    <span class="logo__word">mainstreetlander</span>
  {/if}
</span>

<style>
  .logo {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    line-height: 1;
  }

  .logo__mark {
    width: 26px;
    height: 26px;
    flex: none;
    fill: currentColor;
  }

  .logo__word {
    font-size: 17px;
    font-weight: 620;
    letter-spacing: -0.035em;
  }
</style>

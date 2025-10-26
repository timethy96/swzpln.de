<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import CommandSearch from '$lib/components/CommandSearch.svelte';
    import { Search } from 'lucide-svelte';

    let open = $state(false);
</script>

<header class="flex justify-between items-center p-4 pl-0">
    <span class=""></span>
    <h1 class="text-3xl font-black hover:scale-110 transition-all duration-300">SWZPLN</h1>
    <Button variant="ghost" size="icon" class="w-12 h-12" onclick={() => open = true}>
        <Search class="h-6 w-6" />
    </Button>
</header>

<CommandSearch bind:open />
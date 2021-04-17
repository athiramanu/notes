<svelte:head>
	<title>ScribbleIt</title>
</svelte:head>

<h1>Instructions</h1>

<section class="steps">
    <div class="item"><span>Choose a name for yor NotePad (max: 32 characters)</span></div>
    <div class="item"><span>Append the name to the end of the url. eg: <strong>/myNote</strong></span></div>
    <div class="item"><span>Type your note in the text area (max: 10000 characters)</span></div>
    <div class="item"><span>Click on <strong>Save</strong></span></div>
    <div class="item"><span>Use the new url to access the note from anywhere you want</span></div>
    <div class="item disclaimer"><strong>&lt;&lt;</strong> Only 1000 notes are saved at a time. Old notes can get deleted <strong>&gt;&gt;</strong></div>
</section>

<style>
    h1, 
    .steps strong,
    .disclaimer strong {
		color: var(--lightThemeHeader);
	}


    .disclaimer {
        font-size: 12px;
        margin-top: 8em;
    }

    .disclaimer strong {
        font-size: 16px;
    }

    h1 {
        font-weight: 200;
        margin-top: 50px;
    }

    .steps span {
        left: 10px;
        position: relative;
    }

    .steps {
        margin: auto;
        margin-top: 3em;
        list-style: none;
        line-height: 2em;
    }
</style>
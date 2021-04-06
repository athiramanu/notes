<nav>
    <a href="/" class="homepage"><img src="/logo.png" alt="Scribble It"></a>
    <label class="switch" on:click="{toggle}">
        <input type="checkbox">
        <span class="slider round"></span>
    </label>
</nav>

<style>
    nav {
        top: 0;
        left: 0;
        width: 100vw;
        box-shadow: 0 -0.4rem 0.9rem 0.2rem rgb(0 0 0 / 50%);
        position: fixed;
        background: white;
    }

    .homepage {
        text-decoration: none;
        float: left;
        margin-left: 1em;
        font-size: 30px;
        font-family: system-ui;
    }

    .homepage img {
        height: 35px;
        margin-top: 8px;
    }

    .switch {
        position: relative;
        width: 50px;
        float: right;
        height: 24px;
        margin-top: 8px;
        margin-right: 20px;
    }

    .switch input { 
        opacity: 0;
        width: 0;
        height: 0;
    }

    .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        -webkit-transition: .4s;
        transition: .4s;
    }

    .slider:before {
        position: absolute;
        content: "";
        height: 16px;
        width: 16px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        -webkit-transition: .4s;
        transition: .4s;
    }

    input:checked + .slider {
        background-color: #2196F3;
    }

    input:focus + .slider {
        box-shadow: 0 0 1px #2196F3;
    }

    input:checked + .slider:before {
        -webkit-transform: translateX(26px);
        -ms-transform: translateX(26px);
        transform: translateX(26px);
    }

    .slider.round {
        border-radius: 34px;
    }

    .slider.round:before {
        border-radius: 50%;
    }
</style>

<script>
    import { darkTheme } from "./store.js"

    function toggle(event) {
        if (event.target.classList.contains("slider")) {
            darkTheme.update(value => !value);
        }
    }
</script>
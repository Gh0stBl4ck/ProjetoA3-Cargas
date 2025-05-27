document.getElementById("login-form").addEventListener("submit", function(e) {
 e.preventDefault();

    const usuario = document.getElementById("usuario").value;
    const senha = document.getElementById("senha").value;
    const mensagemErro = document.getElementById("mensagem-erro");

    const usuarioCorreto = "admin";
    const senhaCorreta = "1234";

    if (usuario === usuarioCorreto && senha === senhaCorreta){
        window.location.href = "dashboard.html";
    }else{
        mensagemErro.textContent = "Usuario ou senha incorretos!";
    }

}); 
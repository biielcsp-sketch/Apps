/* ===================================================================
   Café com Deus Shine — landing pública

   Duas coisas acontecem aqui: buscar a configuração da inscrição (se
   está aberta e qual o texto das regras) e enviar o formulário. Toda a
   conversa com o banco passa pela função em /api — a chave do Supabase
   nunca chega ao navegador.
   =================================================================== */

(function () {
  "use strict";

  var APP_URL = (window.CAFE_CONFIG && window.CAFE_CONFIG.appUrl) || "";

  var el = {
    loading: document.getElementById("form-loading"),
    closed: document.getElementById("form-closed"),
    done: document.getElementById("form-done"),
    doneBody: document.getElementById("done-body"),
    doneAccess: document.getElementById("done-access"),
    doneLink: document.getElementById("done-link"),
    form: document.getElementById("form"),
    error: document.getElementById("form-error"),
    submit: document.getElementById("submit"),
    rules: document.getElementById("rules"),
    rulesText: document.getElementById("rules-text"),
    loginLink: document.getElementById("login-link"),
  };

  if (APP_URL) {
    el.loginLink.href = APP_URL + "/login";
    el.doneLink.href = APP_URL + "/criar-acesso";
  } else {
    // Sem endereço do sistema configurado, um link morto é pior que
    // nenhum link — some com ele em vez de mandar a pessoa pro vazio.
    el.loginLink.hidden = true;
  }

  // O código da origem de inscrição, devolvido por /api/config. Vai junto
  // no envio — é ele que identifica de onde veio o cadastro.
  var enrollmentCode = null;

  /* ------------------------ carregar config ------------------------ */

  fetch("/api/config")
    .then(function (r) {
      return r.json();
    })
    .then(function (data) {
      el.loading.hidden = true;

      if (data && data.rules) {
        el.rulesText.textContent = data.rules;
        el.rules.hidden = false;
      }

      if (data && data.open && data.code) {
        enrollmentCode = data.code;
        el.form.hidden = false;
      } else {
        el.closed.hidden = false;
      }
    })
    .catch(function () {
      // Se a função não responder, mostrar "fechado" é mais honesto do
      // que um formulário que vai falhar no envio.
      el.loading.hidden = true;
      el.closed.hidden = false;
    });

  /* ------------------------ validação ------------------------ */

  // Mesmas regras do sistema, para a pessoa saber o que faltou antes de
  // a requisição sair. O servidor valida tudo de novo — isto aqui é
  // conveniência, nunca a barreira.
  function validate(values) {
    if (values.full_name.length < 2) return "Informe seu nome completo.";
    if (values.phone.length < 8) return "Informe um telefone válido, com DDD.";
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      return "E-mail inválido.";
    }
    if (!values.address) return "Informe seu endereço.";
    if (!values.availability_days.length) return "Selecione ao menos um dia disponível.";
    if (!values.availability_period.length) return "Selecione ao menos um período disponível.";
    if (!values.location_preference) return "Informe sua preferência de localização.";
    if (!values.consent_accepted) return "É necessário aceitar os termos para se inscrever.";
    return null;
  }

  function text(name) {
    var node = el.form.elements[name];
    return node && node.value ? node.value.trim() : "";
  }

  function checkedValues(name) {
    var nodes = el.form.querySelectorAll('input[name="' + name + '"]:checked');
    return Array.prototype.map.call(nodes, function (n) {
      return n.value;
    });
  }

  function showError(message) {
    el.error.textContent = message;
    el.error.hidden = false;
    el.error.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  /* ------------------------ envio ------------------------ */

  el.form.addEventListener("submit", function (event) {
    event.preventDefault();
    el.error.hidden = true;

    var values = {
      full_name: text("full_name"),
      preferred_name: text("preferred_name"),
      phone: text("phone"),
      whatsapp: text("whatsapp"),
      email: text("email"),
      birth_date: text("birth_date"),
      city: text("city"),
      neighborhood: text("neighborhood"),
      address: text("address"),
      availability_days: checkedValues("availability_days"),
      availability_period: checkedValues("availability_period"),
      location_preference: text("location_preference"),
      home_meeting_ok: el.form.elements.home_meeting_ok.checked,
      other_notes: text("other_notes"),
      consent_accepted: el.form.elements.consent_accepted.checked,
      code: enrollmentCode,
      website: text("website"),
    };

    var problem = validate(values);
    if (problem) {
      showError(problem);
      return;
    }

    el.submit.disabled = true;
    el.submit.textContent = "Enviando...";

    fetch("/api/inscricao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
      .then(function (r) {
        return r.json().then(function (body) {
          return { ok: r.ok, body: body };
        });
      })
      .then(function (result) {
        if (!result.ok) {
          throw new Error(
            (result.body && result.body.error) ||
              "Não foi possível enviar sua inscrição. Tente novamente.",
          );
        }
        succeed(result.body.status === "duplicate", Boolean(values.email));
      })
      .catch(function (err) {
        el.submit.disabled = false;
        el.submit.textContent = "Quero me inscrever";
        showError(err.message || "Não foi possível enviar sua inscrição. Tente novamente.");
      });
  });

  function succeed(isDuplicate, hasEmail) {
    el.form.hidden = true;
    el.rules.hidden = true;
    el.doneBody.textContent = isDuplicate
      ? "Você já está cadastrada — nossa equipe vai entrar em contato."
      : "Muito obrigada por se inscrever! Nossa equipe vai entrar em contato em breve.";

    // O acesso ao app é liberado pelo e-mail: sem e-mail, não adianta
    // mandar a pessoa para a tela de criar acesso.
    if (hasEmail && APP_URL) {
      el.doneAccess.hidden = false;
    } else if (!hasEmail) {
      var note = document.createElement("p");
      note.className = "done-body done-access-text";
      note.textContent =
        "Para criar seu acesso ao aplicativo depois, avise nossa equipe do seu e-mail — é por ele que o acesso é liberado.";
      el.done.appendChild(note);
    }

    el.done.hidden = false;
    el.done.scrollIntoView({ block: "center", behavior: "smooth" });
  }
})();

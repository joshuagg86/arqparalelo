<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // 1. Recoger y limpiar los datos del formulario
    $nombres = strip_tags(trim($_POST["nombres"]));
    $apellidos = strip_tags(trim($_POST["apellidos"]));
    $email = filter_var(trim($_POST["email"]), FILTER_SANITIZE_EMAIL);
    $telefono = strip_tags(trim($_POST["telefono"]));
    
    // Validar si eligieron un servicio o mandarlo por defecto
    $servicio = isset($_POST["servicio"]) ? strip_tags(trim($_POST["servicio"])) : "No especificado";
    
    $mensaje = trim($_POST["mensaje"]);

    // 2. Validar campos obligatorios básicos
    if (empty($nombres) || empty($apellidos) || empty($mensaje) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        header("Location: index.html?error=campos");
        exit;
    }

    // 3. Configurar destinatario y asunto
    $destinatario = "contacto@arqparalelo.com";
    $asunto = "Nuevo lead / cotización web: $nombres $apellidos";

    // 4. Construir el cuerpo del mensaje que te llegará al correo
    $cuerpo_correo = "Has recibido una nueva solicitud de contacto desde la web:\n\n";
    $cuerpo_correo .= "Nombres: $nombres\n";
    $cuerpo_correo .= "Apellidos: $apellidos\n";
    $cuerpo_correo .= "Correo: $email\n";
    $cuerpo_correo .= "Teléfono: $telefono\n";
    $cuerpo_correo .= "Servicio de interés: $servicio\n\n";
    $cuerpo_correo .= "Mensaje del cliente:\n$mensaje\n";

    // 5. Encabezados del correo
    $headers = "From: no-reply@arqparalelo.com\r\n";
    $headers .= "Reply-To: $email\r\n";

    // 6. Enviar correo
    if (mail($destinatario, $asunto, $cuerpo_correo, $headers)) {
        // Redirige al index con indicador de éxito (puedes mostrar un alert o mensaje visual después)
        header("Location: index.html?enviado=exito");
        exit;
    } else {
        header("Location: index.html?error=servidor");
        exit;
    }
} else {
    header("Location: index.html");
    exit;
}
?>
<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer/src/Exception.php';
require 'PHPMailer/src/PHPMailer.php';
require 'PHPMailer/src/SMTP.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // Collect all form fields safely
    $firstName   = $_POST['firstName']   ?? '';
    $lastName    = $_POST['lastName']    ?? '';
    $email       = $_POST['email']       ?? '';
    $phone       = $_POST['phone']       ?? '';
    $company     = $_POST['company']     ?? '';
    $country     = $_POST['country']     ?? '';
    $city        = $_POST['city']        ?? '';
    $inquiryType = $_POST['inquiryType'] ?? '';
    $message     = $_POST['message']     ?? '';

    $fullName = trim($firstName . ' ' . $lastName);

    $mail = new PHPMailer(true);

    try {
        // SMTP Configuration
        $mail->isSMTP();
        $mail->Host       = 'mail.climaxknits.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'info@climaxknits.com';
        $mail->Password   = 'info@climaxknits1234'; // ⚠️ Replace carefully if you ever change it
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port       = 465;

        // ✅ UTF-8 Encoding (for emojis + non-English)
        $mail->CharSet    = 'UTF-8';
        $mail->Encoding   = 'base64';

        // Recipients
        $mail->setFrom('info@climaxknits.com', 'Climax Hosiery Website');
        $mail->addAddress('info@climaxknits.com', 'Admin');
        $mail->addReplyTo($email, $fullName);

        // Email Content
        $mail->isHTML(true);
        $mail->Subject = 'New Contact Inquiry from ' . $fullName;

        $mail->Body = "
            <h2 style='color:#d32f2f;'>New Contact Message</h2>
            <p><strong>Name:</strong> {$fullName}</p>
            <p><strong>Country:</strong> {$country}</p>
            <p><strong>City:</strong> {$city}</p>
            <p><strong>Email:</strong> {$email}</p>
            <p><strong>Phone:</strong> {$phone}</p>
            <p><strong>Company:</strong> {$company}</p>
            <p><strong>Inquiry Type:</strong> {$inquiryType}</p>
            <hr style='border:1px solid #ddd;'>
            <p><strong>Message:</strong></p>
            <p>" . nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8')) . "</p>
        ";

        $mail->AltBody =
            "New Contact Message\n\n" .
            "Name: {$fullName}\n" .
            "Country: {$country}\n" .
            "City: {$city}\n" .
            "Email: {$email}\n" .
            "Phone: {$phone}\n" .
            "Company: {$company}\n" .
            "Inquiry Type: {$inquiryType}\n\n" .
            "Message:\n{$message}";

        $mail->send();
        echo json_encode(['status' => 'success']);

    } catch (Exception $e) {
        echo json_encode([
            'status' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}
?>

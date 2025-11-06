import static org.junit.Assert.assertEquals;
import org.junit.Test;

public class Test {

    @Test
    public void testValidLogin() {
        String login = "user123";
        boolean isValid = LoginValidator.validateLogin(login);
        assertEquals(true, isValid);
    }

    @Test
    public void testInvalidLogin() {
        String login = "user@invalid";
        boolean isValid = LoginValidator.validateLogin(login);
        assertEquals(false, isValid);
    }
}

public class LoginValidator {

    public static boolean validateLogin(String login) {
        return login.matches("^[a-zA-Z0-9]{3,20}$");
    }
}

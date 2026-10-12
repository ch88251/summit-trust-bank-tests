package bank;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.intuit.karate.Results;
import com.intuit.karate.Runner;
import org.junit.jupiter.api.Test;

class BankTest {

  @Test
  void runAll() {
    Results results = Runner.path("classpath:bank")
      .tags("~@ignore")
      .parallel(1);
    assertEquals(0, results.getFailCount(), results.getErrorMessages());
  }
}

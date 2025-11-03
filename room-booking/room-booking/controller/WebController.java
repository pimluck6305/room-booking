// ... (Import ที่จำเป็น) ...
import com.myproject.models.User;
import com.myproject.models.UserProfile;
import com.myproject.repository.UserProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
// ... (Import อื่นๆ) ...

@Controller
public class WebController {

    // ... (Repository อื่นๆ ที่มีอยู่แล้ว) ...

    @Autowired
    private UserProfileRepository userProfileRepository;

    // --- ( Method อื่นๆ ที่คุณมีอยู่แล้ว ) ---
    // @GetMapping("/")
    // @GetMapping("/book/{id}")
    // @PostMapping("/book/save")
    // @GetMapping("/my-bookings")
    // ---------------------------------

    /**
     * 6. แสดงหน้า Login
     */
    @GetMapping("/login")
    public String showLoginPage() {
        return "login"; // ไปที่ login.html
    }
    
    /**
     * 7. แสดงหน้าสมัครสมาชิก
     */
    @GetMapping("/register")
    public String showRegisterPage(Model model) {
        // ส่ง "ตั๋ว" เปล่าๆ ไปให้ฟอร์ม
        model.addAttribute("registrationRequest", new RegistrationRequest());
        return "register"; // ไปที่ register.html
    }

    /**
     * 8. ประมวลผลการสมัครสมาชิก (สร้าง One-to-One)
     */
    @PostMapping("/register")
    public String processRegistration(@ModelAttribute RegistrationRequest request) {
        // 1. สร้าง User (ตารางหลัก)
        User newUser = new User();
        newUser.setUsername(request.getUsername());
        newUser.setPassword(request.getPassword()); // (ในระบบจริง ต้องเข้ารหัสก่อน)
        // (ยังไม่ save... )

        // 2. สร้าง UserProfile (ตารางลูก)
        UserProfile newProfile = new UserProfile();
        newProfile.setFirstName(request.getFirstName());
        newProfile.setLastName(request.getLastName());
        newProfile.setTelephone(request.getTelephone());
        
        // 3. ผูกทั้งสองเข้าด้วยกัน (หัวใจของ One-to-One)
        newProfile.setUser(newUser); // บอก Profile ว่าเจ้าของคือ User คนนี้
        newUser.setUserProfile(newProfile); // บอก User ว่า Profile คืออันนี้

        // 4. บันทึก User (และ Profile จะถูกบันทึกตามไปด้วย เพราะตั้ง Cascade ไว้)
        userRepository.save(newUser);
        
        return "redirect:/login"; // สมัครเสร็จ ให้ไปหน้า Login
    }

    /**
     * 9. แสดงหน้าโปรไฟล์ (ดึงข้อมูล One-to-One)
     */
    @GetMapping("/profile")
    public String showProfilePage(Model model) {
        // (ชั่วคราว) จำลองว่าเราล็อกอินเป็น User ID 1
        User currentUser = userRepository.findById(1L).orElse(null);
        if (currentUser == null) {
            return "redirect:/login";
        }

        // ดึง Profile จาก User (นี่คือการใช้ One-to-One)
        UserProfile profile = currentUser.getUserProfile(); 
        
        // (เผื่อกรณียังไม่มี Profile)
        if (profile == null) {
            profile = new UserProfile();
            profile.setUser(currentUser);
        }

        model.addAttribute("userProfile", profile);
        return "profile"; // ไปที่ profile.html
    }

    /**
     * 10. บันทึกการแก้ไขโปรไฟล์ (อัปเดต One-to-One)
     */
    @PostMapping("/profile/save")
    public String saveProfile(@ModelAttribute UserProfile userProfile) {
        // (ในระบบจริง ต้องดึง User ที่ล็อกอินอยู่มา set ที่ userProfile.setUser() อีกครั้ง)
        
        // บันทึกการเปลี่ยนแปลงลง DB
        userProfileRepository.save(userProfile);
        
        return "redirect:/profile"; // บันทึกเสร็จ กลับมาหน้าเดิม
    }
}
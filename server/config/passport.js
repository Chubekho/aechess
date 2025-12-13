// server/config/passport.js
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 1. Tìm user bằng Google ID
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          return done(null, { user, isNew: false }); // User đã tồn tại, cho đăng nhập
        }

        // 2. Nếu Google ID không có, tìm bằng email
        user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          // User đã có tài khoản (bằng email/pass), liên kết Google ID
          user.googleId = profile.id;
          await user.save();
          return done(null, { user, isNew: false });
        }

        const tempUsername = "user_" + Date.now() + Math.floor(Math.random() * 1000);

        // 3. User mới hoàn toàn -> Tạo bản ghi tạm (chưa có username chuẩn)
        // Mẹo: Tạo username tạm ngẫu nhiên để pass validate 'required' của Mongoose
        const newUser = new User({
          googleId: profile.id,
          email: profile.emails[0].value,
          displayName: profile.displayName,
          username: tempUsername, // Username tạm
        });
        await newUser.save();
        return done(null, { user: newUser, isNew: true });
      } catch (err) {
        return done(err, false);
      }
    }
  )
);

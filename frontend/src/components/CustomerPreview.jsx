import { Avatar, Box, Typography } from "@mui/material";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";

const FONT = "'Plus Jakarta Sans', 'DM Sans', sans-serif";
const ITEM_HEIGHT = 72;
const VISIBLE_COUNT = 5;

const NAVY = "#233971";
const NAVY_LIGHT = "#e8edf7";
const NAVY_SOFT = "#f0f3fa";
const NAVY_MID = "#3d5a9e";

function formatRupiah(value) {
  if (!value) return "Rp 0";
  const num = Number(String(value).replace(/[^\d.-]/g, ""));
  if (Number.isNaN(num)) return String(value);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function getInitials(name) {
  if (!name || name === "-") return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export default function CustomerPreview({ customers }) {
  const totalNominal = customers.reduce((sum, item) => {
    const value = Number(String(item?.total ?? "").replace(/[^\d.-]/g, ""));
    return sum + (Number.isNaN(value) ? 0 : value);
  }, 0);

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        fontFamily: FONT,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          mb: 2,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography
            sx={{
              fontFamily: FONT,
              fontSize: 14,
              fontWeight: 700,
              color: "#0d1b3e",
              letterSpacing: "-0.3px",
              lineHeight: 1.3,
            }}
          >
            Preview Pelanggan
          </Typography>
          <Typography
            sx={{
              fontFamily: FONT,
              fontSize: 11,
              color: "#94a3b8",
              mt: 0.3,
            }}
          >
            {customers.length
              ? `${Math.min(customers.length, VISIBLE_COUNT)} dari ${customers.length} data ditampilkan`
              : "Belum ada data"}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 0.8, alignItems: "center" }}>
          <Box
            sx={{
              height: 24,
              px: 1.2,
              borderRadius: "6px",
              bgcolor: NAVY_SOFT,
              border: `1px solid ${NAVY_LIGHT}`,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Typography
              sx={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: NAVY }}
            >
              {customers.length} data
            </Typography>
          </Box>
          <Box
            sx={{
              height: 24,
              px: 1.2,
              borderRadius: "6px",
              bgcolor: NAVY,
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <PaymentsRoundedIcon sx={{ fontSize: 11, color: "#fff" }} />
            <Typography
              sx={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: "#fff" }}
            >
              {formatRupiah(totalNominal)}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Empty State */}
      {!customers.length ? (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.5,
            py: 5,
            px: 2,
            borderRadius: "16px",
            border: `1.5px dashed ${NAVY_LIGHT}`,
            bgcolor: NAVY_SOFT,
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "16px",
              bgcolor: NAVY_LIGHT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PeopleAltRoundedIcon sx={{ fontSize: 26, color: NAVY }} />
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography
              sx={{
                color: "#0d1b3e",
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "-0.2px",
              }}
            >
              Belum ada data pelanggan
            </Typography>
            <Typography
              sx={{
                color: "#94a3b8",
                fontFamily: FONT,
                fontSize: 11.5,
                mt: 0.5,
                lineHeight: 1.6,
                maxWidth: 220,
              }}
            >
              Upload Excel atau sinkronkan Google Sheet untuk mulai.
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            maxHeight: ITEM_HEIGHT * VISIBLE_COUNT + (VISIBLE_COUNT - 1) * 8,
            overflowY: "auto",
            overflowX: "hidden",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            pr: 0.5,
            "&::-webkit-scrollbar": { width: 3 },
            "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: NAVY_LIGHT,
              borderRadius: 999,
            },
          }}
        >
          {customers.map((item, index) => (
            <Box
              key={`${item.nomor}-${index}`}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 1.5,
                height: ITEM_HEIGHT,
                minHeight: ITEM_HEIGHT,
                borderRadius: "12px",
                border: `1px solid ${NAVY_LIGHT}`,
                bgcolor: "#fff",
                flexShrink: 0,
                transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                "&:hover": {
                  borderColor: NAVY_MID,
                  boxShadow: `0 4px 16px rgba(35,57,113,0.08)`,
                },
              }}
            >
              <Avatar
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: "10px",
                  bgcolor: NAVY,
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 800,
                  fontFamily: FONT,
                  flexShrink: 0,
                  letterSpacing: "0.5px",
                }}
              >
                {getInitials(item.nama)}
              </Avatar>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    color: "#0d1b3e",
                    fontFamily: FONT,
                    fontSize: 13,
                    fontWeight: 700,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    letterSpacing: "-0.2px",
                  }}
                >
                  {item.nama || "-"}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.4 }}>
                  <PhoneRoundedIcon sx={{ fontSize: 10, color: "#c8d3e8" }} />
                  <Typography
                    sx={{
                      color: "#b0bcd4",
                      fontFamily: FONT,
                      fontSize: 11,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.nomor || "-"}
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  px: 1.2,
                  py: 0.5,
                  borderRadius: "8px",
                  bgcolor: NAVY_SOFT,
                  border: `1px solid ${NAVY_LIGHT}`,
                  flexShrink: 0,
                }}
              >
                <Typography
                  sx={{
                    color: NAVY,
                    fontFamily: FONT,
                    fontSize: 11,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                    letterSpacing: "-0.2px",
                  }}
                >
                  {formatRupiah(item.total)}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Footer */}
      {customers.length > VISIBLE_COUNT && (
        <Box
          sx={{
            mt: 1.2,
            pt: 1,
            borderTop: `1px dashed ${NAVY_LIGHT}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            sx={{ color: "#b0bcd4", fontFamily: FONT, fontSize: 11, fontWeight: 500 }}
          >
            +{customers.length - VISIBLE_COUNT} pelanggan lainnya
          </Typography>
        </Box>
      )}
    </Box>
  );
}
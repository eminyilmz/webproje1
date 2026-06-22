"""
Piksel Renklendirme Ağ Mimarisi
================================
Derin CNN tabanlı renklendirme modeli.
10 aşamalı encoder + 3 aşamalı decoder + skip connections.
L*a*b* renk uzayında çalışır: L kanalı girdi, ab kanalları çıktı.
"""
import torch
import torch.nn as nn

from .base_color import *


class PikselColorizerNet(BaseColor):
    """
    Renklendirme için tasarlanmış derin CNN mimarisi.
    - 10 konvolüsyon bloğu (encoder)
    - 3 upsampling bloğu (decoder) + skip connections
    - 529 sınıflı classification head + 2 kanallı regression çıktısı
    """
    def __init__(self, norm_layer=nn.BatchNorm2d, classes=529):
        super(PikselColorizerNet, self).__init__()

        # Blok 1 — 64 filtre
        model1 = [nn.Conv2d(4, 64, kernel_size=3, stride=1, padding=1, bias=True),]
        model1 += [nn.ReLU(True),]
        model1 += [nn.Conv2d(64, 64, kernel_size=3, stride=1, padding=1, bias=True),]
        model1 += [nn.ReLU(True),]
        model1 += [norm_layer(64),]

        # Blok 2 — 128 filtre
        model2 = [nn.Conv2d(64, 128, kernel_size=3, stride=1, padding=1, bias=True),]
        model2 += [nn.ReLU(True),]
        model2 += [nn.Conv2d(128, 128, kernel_size=3, stride=1, padding=1, bias=True),]
        model2 += [nn.ReLU(True),]
        model2 += [norm_layer(128),]

        # Blok 3 — 256 filtre
        model3 = [nn.Conv2d(128, 256, kernel_size=3, stride=1, padding=1, bias=True),]
        model3 += [nn.ReLU(True),]
        model3 += [nn.Conv2d(256, 256, kernel_size=3, stride=1, padding=1, bias=True),]
        model3 += [nn.ReLU(True),]
        model3 += [nn.Conv2d(256, 256, kernel_size=3, stride=1, padding=1, bias=True),]
        model3 += [nn.ReLU(True),]
        model3 += [norm_layer(256),]

        # Blok 4 — 512 filtre
        model4 = [nn.Conv2d(256, 512, kernel_size=3, stride=1, padding=1, bias=True),]
        model4 += [nn.ReLU(True),]
        model4 += [nn.Conv2d(512, 512, kernel_size=3, stride=1, padding=1, bias=True),]
        model4 += [nn.ReLU(True),]
        model4 += [nn.Conv2d(512, 512, kernel_size=3, stride=1, padding=1, bias=True),]
        model4 += [nn.ReLU(True),]
        model4 += [norm_layer(512),]

        # Blok 5 — 512 filtre, dilated conv
        model5 = [nn.Conv2d(512, 512, kernel_size=3, dilation=2, stride=1, padding=2, bias=True),]
        model5 += [nn.ReLU(True),]
        model5 += [nn.Conv2d(512, 512, kernel_size=3, dilation=2, stride=1, padding=2, bias=True),]
        model5 += [nn.ReLU(True),]
        model5 += [nn.Conv2d(512, 512, kernel_size=3, dilation=2, stride=1, padding=2, bias=True),]
        model5 += [nn.ReLU(True),]
        model5 += [norm_layer(512),]

        # Blok 6 — 512 filtre, dilated conv
        model6 = [nn.Conv2d(512, 512, kernel_size=3, dilation=2, stride=1, padding=2, bias=True),]
        model6 += [nn.ReLU(True),]
        model6 += [nn.Conv2d(512, 512, kernel_size=3, dilation=2, stride=1, padding=2, bias=True),]
        model6 += [nn.ReLU(True),]
        model6 += [nn.Conv2d(512, 512, kernel_size=3, dilation=2, stride=1, padding=2, bias=True),]
        model6 += [nn.ReLU(True),]
        model6 += [norm_layer(512),]

        # Blok 7 — 512 filtre
        model7 = [nn.Conv2d(512, 512, kernel_size=3, stride=1, padding=1, bias=True),]
        model7 += [nn.ReLU(True),]
        model7 += [nn.Conv2d(512, 512, kernel_size=3, stride=1, padding=1, bias=True),]
        model7 += [nn.ReLU(True),]
        model7 += [nn.Conv2d(512, 512, kernel_size=3, stride=1, padding=1, bias=True),]
        model7 += [nn.ReLU(True),]
        model7 += [norm_layer(512),]

        # Decoder — Blok 8 (skip connection: blok 3)
        model8up = [nn.ConvTranspose2d(512, 256, kernel_size=4, stride=2, padding=1, bias=True)]
        model3short8 = [nn.Conv2d(256, 256, kernel_size=3, stride=1, padding=1, bias=True),]

        model8 = [nn.ReLU(True),]
        model8 += [nn.Conv2d(256, 256, kernel_size=3, stride=1, padding=1, bias=True),]
        model8 += [nn.ReLU(True),]
        model8 += [nn.Conv2d(256, 256, kernel_size=3, stride=1, padding=1, bias=True),]
        model8 += [nn.ReLU(True),]
        model8 += [norm_layer(256),]

        # Decoder — Blok 9 (skip connection: blok 2)
        model9up = [nn.ConvTranspose2d(256, 128, kernel_size=4, stride=2, padding=1, bias=True),]
        model2short9 = [nn.Conv2d(128, 128, kernel_size=3, stride=1, padding=1, bias=True),]

        model9 = [nn.ReLU(True),]
        model9 += [nn.Conv2d(128, 128, kernel_size=3, stride=1, padding=1, bias=True),]
        model9 += [nn.ReLU(True),]
        model9 += [norm_layer(128),]

        # Decoder — Blok 10 (skip connection: blok 1)
        model10up = [nn.ConvTranspose2d(128, 128, kernel_size=4, stride=2, padding=1, bias=True),]
        model1short10 = [nn.Conv2d(64, 128, kernel_size=3, stride=1, padding=1, bias=True),]

        model10 = [nn.ReLU(True),]
        model10 += [nn.Conv2d(128, 128, kernel_size=3, dilation=1, stride=1, padding=1, bias=True),]
        model10 += [nn.LeakyReLU(negative_slope=.2),]

        # Classification çıktısı
        model_class = [nn.Conv2d(256, classes, kernel_size=1, padding=0, dilation=1, stride=1, bias=True),]

        # Regression çıktısı (ab kanalları)
        model_out = [nn.Conv2d(128, 2, kernel_size=1, padding=0, dilation=1, stride=1, bias=True),]
        model_out += [nn.Tanh()]

        self.model1 = nn.Sequential(*model1)
        self.model2 = nn.Sequential(*model2)
        self.model3 = nn.Sequential(*model3)
        self.model4 = nn.Sequential(*model4)
        self.model5 = nn.Sequential(*model5)
        self.model6 = nn.Sequential(*model6)
        self.model7 = nn.Sequential(*model7)
        self.model8up = nn.Sequential(*model8up)
        self.model8 = nn.Sequential(*model8)
        self.model9up = nn.Sequential(*model9up)
        self.model9 = nn.Sequential(*model9)
        self.model10up = nn.Sequential(*model10up)
        self.model10 = nn.Sequential(*model10)
        self.model3short8 = nn.Sequential(*model3short8)
        self.model2short9 = nn.Sequential(*model2short9)
        self.model1short10 = nn.Sequential(*model1short10)

        self.model_class = nn.Sequential(*model_class)
        self.model_out = nn.Sequential(*model_out)

        self.upsample4 = nn.Sequential(*[nn.Upsample(scale_factor=4, mode='bilinear'),])
        self.softmax = nn.Sequential(*[nn.Softmax(dim=1),])

    def forward(self, input_A, input_B=None, mask_B=None):
        if(input_B is None):
            input_B = torch.cat((input_A*0, input_A*0), dim=1)
        if(mask_B is None):
            mask_B = input_A*0

        conv1_2 = self.model1(torch.cat((self.normalize_l(input_A), self.normalize_ab(input_B), mask_B), dim=1))
        conv2_2 = self.model2(conv1_2[:,:,::2,::2])
        conv3_3 = self.model3(conv2_2[:,:,::2,::2])
        conv4_3 = self.model4(conv3_3[:,:,::2,::2])
        conv5_3 = self.model5(conv4_3)
        conv6_3 = self.model6(conv5_3)
        conv7_3 = self.model7(conv6_3)

        conv8_up = self.model8up(conv7_3) + self.model3short8(conv3_3)
        conv8_3 = self.model8(conv8_up)
        conv9_up = self.model9up(conv8_3) + self.model2short9(conv2_2)
        conv9_3 = self.model9(conv9_up)
        conv10_up = self.model10up(conv9_3) + self.model1short10(conv1_2)
        conv10_2 = self.model10(conv10_up)
        out_reg = self.model_out(conv10_2)

        return self.unnormalize_ab(out_reg)


def piksel_colorizer(pretrained=True):
    """Eğitilmiş renklendirme modelini yükle."""
    import os
    model = PikselColorizerNet()
    if pretrained:
        weights_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'hub', 'checkpoints')
        weights_path = os.path.join(weights_dir, 'piksel_colorization_trained.pth')
        if os.path.exists(weights_path):
            state = torch.load(weights_path, map_location='cpu')
            model.load_state_dict(state)
        else:
            raise FileNotFoundError(f"Ağırlık dosyası bulunamadı: {weights_path}")
    return model



